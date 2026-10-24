import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings, type SiteSettings } from "@/lib/settings"
import { getIssue, type IssueData } from "@/lib/issue"
import { renderIssueEmail } from "@/lib/emails/issue"
import { welcomeEmail } from "@/lib/emails/welcome"
import { siteUrl, unsubscribeUrl } from "@/lib/site"

/**
 * Every email goes through email_queue, so sending stays inside Resend's allowance
 * (free plan: 100 a day, 3,000 a month). Whatever doesn't fit today stays queued and
 * the hourly cron sends it once the last 24 hours have room again. Welcome emails
 * go first, then tests, then issues, oldest first.
 */

export type QueueKind = "welcome" | "issue" | "test"

const DAILY_LIMIT = Number(process.env.RESEND_DAILY_LIMIT || 100)
const MONTHLY_LIMIT = Number(process.env.RESEND_MONTHLY_LIMIT || 3000)
const BATCH = 100
const MAX_ATTEMPTS = 3
const DAY = 24 * 60 * 60 * 1000

interface QueueRow {
  id: string
  kind: QueueKind
  subscriber_id: string | null
  issue_id: string | null
  to_email: string
  attempts: number
  subscribers: { status: string; name: string | null } | null
}

/** How many emails can still go out now, counting everything sent in the last 24 hours and 30 days. */
export const quotaLeft = async () => {
  const db = supabaseAdmin()
  const since = (ms: number) => new Date(Date.now() - ms).toISOString()
  const [{ count: day }, { count: month }] = await Promise.all([
    db.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", since(DAY)),
    db.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", since(30 * DAY)),
  ])
  return Math.max(0, Math.min(DAILY_LIMIT - (day || 0), MONTHLY_LIMIT - (month || 0)))
}

/** Queues the welcome email. A reader who comes back after unsubscribing gets it again. */
export const enqueueWelcome = async (sub: { id: string; email: string }) => {
  const db = supabaseAdmin()
  const { data: existing } = await db.from("email_queue").select("id")
    .eq("kind", "welcome").eq("subscriber_id", sub.id).maybeSingle()
  const { error } = existing
    ? await db.from("email_queue").update({ status: "queued", attempts: 0, error: null, to_email: sub.email, created_at: new Date().toISOString() }).eq("id", existing.id)
    : await db.from("email_queue").insert({ kind: "welcome", subscriber_id: sub.id, to_email: sub.email })
  if (error) throw new Error(error.message)
}

/** Queues an issue for every active subscriber who hasn't already got it. Returns how many were added. */
export const enqueueIssue = async (issueId: string) => {
  const db = supabaseAdmin()
  const [{ data: subs }, { data: done }] = await Promise.all([
    db.from("subscribers").select("id, email").eq("status", "active"),
    db.from("email_queue").select("subscriber_id").eq("kind", "issue").eq("issue_id", issueId),
  ])
  const already = new Set((done || []).map(r => r.subscriber_id))
  const rows = (subs || []).filter(s => !already.has(s.id))
    .map(s => ({ kind: "issue", subscriber_id: s.id, issue_id: issueId, to_email: s.email }))
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from("email_queue").insert(rows.slice(i, i + 500))
    if (error) throw new Error(error.message)
  }
  return rows.length
}

/** Queues a test of an issue to one address (no subscriber, no once-only rule). */
export const enqueueTest = async (issueId: string, to: string) => {
  const { data, error } = await supabaseAdmin().from("email_queue")
    .insert({ kind: "test", issue_id: issueId, to_email: to }).select("id").single()
  if (error) throw new Error(error.message)
  return data.id as string
}

const KIND_ORDER: QueueKind[] = ["welcome", "test", "issue"]

/** Builds one Resend message for a queue row. */
const message = (row: QueueRow, s: SiteSettings, issues: Map<string, IssueData>) => {
  const unsub = unsubscribeUrl(row.to_email)
  const base = {
    from: s.fromAddress,
    to: row.to_email,
    replyTo: s.editorContact || undefined,
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  }
  if (row.kind === "welcome") {
    return {
      ...base,
      ...welcomeEmail({
        siteUrl: siteUrl(), unsubscribeUrl: unsub, name: row.subscribers?.name || "",
        publishDay: s.publishDay, publishTime: s.publishTime, editorName: s.editorName, contactEmail: s.editorContact,
      }),
    }
  }
  const data = issues.get(row.issue_id || "")
  if (!data) return null
  const { subject, html } = renderIssueEmail(data, s, { unsubscribeUrl: unsub })
  return { ...base, subject: row.kind === "test" ? `[Test] ${subject}` : subject, html }
}

export interface DrainResult {
  sent: number
  failed: number
  skipped: number
  queued: number
  quotaLeft: number
  stoppedBy?: string
}

/**
 * Sends queued emails until the queue or today's allowance runs out.
 * `ids` limits it to particular rows (a test email); `kinds` to particular kinds.
 */
export const drainQueue = async (opts: { kinds?: QueueKind[]; ids?: string[]; max?: number } = {}): Promise<DrainResult> => {
  const db = supabaseAdmin()
  const result: DrainResult = { sent: 0, failed: 0, skipped: 0, queued: 0, quotaLeft: 0 }
  let left = Math.min(await quotaLeft(), opts.max ?? Infinity)

  const rows: QueueRow[] = []
  for (const kind of KIND_ORDER.filter(k => !opts.kinds || opts.kinds.includes(k))) {
    if (rows.length >= left) break
    let q = db.from("email_queue")
      .select("id, kind, subscriber_id, issue_id, to_email, attempts, subscribers(status, name)")
      .eq("status", "queued").eq("kind", kind).order("created_at").limit(left - rows.length)
    if (opts.ids) q = q.in("id", opts.ids)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    rows.push(...((data || []) as unknown as QueueRow[]))
  }

  // Readers who unsubscribed or bounced since being queued are skipped, not emailed.
  const gone = rows.filter(r => r.subscriber_id && r.subscribers?.status !== "active")
  if (gone.length) {
    await db.from("email_queue").update({ status: "skipped", error: "subscriber not active" }).in("id", gone.map(r => r.id))
    result.skipped = gone.length
  }
  const sendable = rows.filter(r => !gone.includes(r))

  if (sendable.length && left > 0) {
    const s = await getSettings()
    const issues = new Map<string, IssueData>()
    for (const id of new Set(sendable.map(r => r.issue_id).filter(Boolean) as string[])) {
      const { data: issue } = await db.from("issues").select("slug").eq("id", id).maybeSingle()
      const data = issue && await getIssue(issue.slug, { includeUnpublished: true })
      if (data) issues.set(id, data)
    }
    const resend = new Resend(process.env.RESEND_API_KEY)

    for (let i = 0; i < sendable.length && left > 0; i += BATCH) {
      const chunk = sendable.slice(i, i + Math.min(BATCH, left))
      const built = chunk.map(r => ({ row: r, msg: message(r, s, issues) }))
      const missing = built.filter(b => !b.msg).map(b => b.row.id)
      if (missing.length) {
        await db.from("email_queue").update({ status: "failed", error: "issue not found" }).in("id", missing)
        result.failed += missing.length
      }
      const ready = built.filter(b => b.msg)
      if (!ready.length) continue

      const { data, error } = await resend.batch.send(ready.map(b => b.msg!), {
        batchValidation: "permissive",
        // The same rows always give the same key, so a retry after a crash can't send twice.
        idempotencyKey: `queue-${ready[0].row.id}-${ready.length}-${ready[ready.length - 1].row.id}-${ready[0].row.attempts}`,
      })
      if (error) {
        // Quota and rate limits leave the rows queued for the next run.
        if (["daily_quota_exceeded", "monthly_quota_exceeded", "rate_limit_exceeded"].includes(error.name)) {
          result.stoppedBy = error.name
          break
        }
        await Promise.all(ready.map(b => db.from("email_queue").update({
          attempts: b.row.attempts + 1, error: error.message.slice(0, 500),
          status: b.row.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "queued",
        }).eq("id", b.row.id)))
        result.failed += ready.length
        result.stoppedBy = error.message
        break
      }

      const errors = new Map((("errors" in data ? data.errors : []) || []).map(e => [e.index, e.message]))
      const ids = [...data.data]
      const now = new Date().toISOString()
      await Promise.all(ready.map((b, idx) => {
        const err = errors.get(idx)
        // Permissive batches return ids only for the emails that were accepted, in order.
        if (err) {
          result.failed++
          return db.from("email_queue").update({
            attempts: b.row.attempts + 1, error: err.slice(0, 500),
            status: b.row.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "queued",
          }).eq("id", b.row.id)
        }
        result.sent++
        return db.from("email_queue").update({
          status: "sent", sent_at: now, attempts: b.row.attempts + 1, error: null, resend_id: ids.shift()?.id ?? null,
        }).eq("id", b.row.id)
      }))
      left -= ready.length
    }
  }

  const { count } = await db.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "queued")
  result.queued = count || 0
  result.quotaLeft = await quotaLeft()
  return result
}

/** Sent / queued / failed counts for one issue, for the Editor's Desk. */
export const issueEmailProgress = async (issueId: string) => {
  const db = supabaseAdmin()
  const count = (status: string) => db.from("email_queue").select("id", { count: "exact", head: true })
    .eq("kind", "issue").eq("issue_id", issueId).eq("status", status)
  const [sent, queued, failed, skipped] = await Promise.all(["sent", "queued", "failed", "skipped"].map(count))
  return { sent: sent.count || 0, queued: queued.count || 0, failed: failed.count || 0, skipped: skipped.count || 0 }
}
