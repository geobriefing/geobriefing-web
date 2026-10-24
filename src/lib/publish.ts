import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings, type SiteSettings } from "@/lib/settings"
import { computeReadTime, getIssue } from "@/lib/issue"
import { renderIssueEmail } from "@/lib/emails/issue"
import { nextPublishSlot } from "@/lib/schedule"
import { unsubscribeUrl } from "@/lib/site"

const BATCH = 100

export interface PublishResult {
  issueNumber: number
  published: boolean
  emailed: number
  emailError?: string
}

const resend = () => new Resend(process.env.RESEND_API_KEY)

/** Sends one rendered issue to a list of addresses, 100 per Resend batch call. */
const sendToAll = async (issueRef: string, s: SiteSettings, recipients: string[]) => {
  const data = await getIssue(issueRef, { includeUnpublished: true })
  if (!data) throw new Error("Issue not found")
  let sent = 0
  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH)
    const { error } = await resend().batch.send(chunk.map(to => {
      const unsub = unsubscribeUrl(to)
      const { subject, html } = renderIssueEmail(data, s, { unsubscribeUrl: unsub })
      return {
        from: s.fromAddress,
        to,
        subject,
        html,
        replyTo: s.editorContact || undefined,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      }
    }))
    if (error) throw new Error(error.message)
    sent += chunk.length
  }
  return sent
}

/**
 * Publishes an issue: stores the read time, numbers the country desk, sets
 * status and published_at, then emails active subscribers once (email_sent_at
 * guards against sending twice if this runs again).
 */
export const publishIssue = async (issueId: string, opts: { sendEmail?: boolean } = {}): Promise<PublishResult> => {
  const db = supabaseAdmin()
  const { data: issue, error } = await db.from("issues").select("*").eq("id", issueId).single()
  if (error || !issue) throw new Error("Issue not found")

  const preview = await getIssue(issue.slug, { includeUnpublished: true })
  if (!preview) throw new Error("Issue not found")

  // Desk numbers count published desks only, so they go 1, 2, 3 with no gaps.
  if (preview.countryDesk && preview.countryDesk.desk_number == null) {
    const { data: last } = await db.from("country_desks").select("desk_number")
      .not("desk_number", "is", null).order("desk_number", { ascending: false }).limit(1).maybeSingle()
    await db.from("country_desks").update({ desk_number: (last?.desk_number || 0) + 1 }).eq("id", preview.countryDesk.id)
  }

  if (issue.status !== "published") {
    const { error: upErr } = await db.from("issues").update({
      status: "published",
      published_at: issue.published_at || new Date().toISOString(),
      read_time_minutes: computeReadTime(preview),
    }).eq("id", issueId)
    if (upErr) throw new Error(upErr.message)
  }

  const result: PublishResult = { issueNumber: issue.issue_number, published: true, emailed: 0 }
  if (opts.sendEmail === false || issue.email_sent_at) return result

  try {
    const s = await getSettings()
    const { data: subs } = await db.from("subscribers").select("email").eq("status", "active")
    const recipients = (subs || []).map(r => r.email)
    result.emailed = recipients.length ? await sendToAll(issue.slug, s, recipients) : 0
    await db.from("issues").update({ email_sent_at: new Date().toISOString() }).eq("id", issueId)
  } catch (e) {
    // The issue stays published; the email can be retried from the Editor's Desk.
    result.emailError = (e as Error).message
  }
  return result
}

/** Sends the rendered issue to one address only (the editor), without publishing anything. */
export const sendTestEmail = async (issueId: string, to: string) => {
  const db = supabaseAdmin()
  const { data: issue } = await db.from("issues").select("slug").eq("id", issueId).single()
  if (!issue) throw new Error("Issue not found")
  const s = await getSettings()
  return sendToAll(issue.slug, s, [to])
}

/**
 * Hourly scheduler: publishes every scheduled issue whose slot has arrived.
 * The slot is the first publish day/time (from Settings) at or after the moment
 * the editor scheduled it, so changing Settings reschedules with no deploy.
 */
export const runScheduler = async (now = new Date()) => {
  const db = supabaseAdmin()
  const s = await getSettings()
  const { data: scheduled } = await db.from("issues").select("id, issue_number, scheduled_at").eq("status", "scheduled")
  const results: (PublishResult & { slot: string })[] = []
  const waiting: { issueNumber: number; slot: string }[] = []
  for (const issue of scheduled || []) {
    const slot = nextPublishSlot(new Date(issue.scheduled_at || now), s)
    if (now.getTime() >= slot.getTime()) {
      results.push({ ...(await publishIssue(issue.id)), slot: slot.toISOString() })
    } else {
      waiting.push({ issueNumber: issue.issue_number, slot: slot.toISOString() })
    }
  }
  return { published: results, waiting }
}
