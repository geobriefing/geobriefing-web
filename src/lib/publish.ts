import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings } from "@/lib/settings"
import { computeReadTime, getIssue } from "@/lib/issue"
import { nextPublishSlot } from "@/lib/schedule"
import { drainQueue, enqueueIssue, enqueueTest } from "@/lib/emailQueue"

export interface PublishResult {
  issueNumber: number
  published: boolean
  /** Sent in this run. */
  emailed: number
  /** Still waiting for tomorrow's allowance. */
  queued: number
  emailError?: string
}

/**
 * Publishes an issue: stores the read time, numbers the country desk, sets
 * status and published_at, then queues the issue for every active subscriber
 * and sends as many as today's allowance allows. The rest go out on the next
 * hourly runs once the allowance frees up. email_sent_at records when it was
 * queued, so running this again never queues it twice.
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

  const result: PublishResult = { issueNumber: issue.issue_number, published: true, emailed: 0, queued: 0 }
  if (opts.sendEmail === false || issue.email_sent_at) return result

  try {
    await enqueueIssue(issueId)
    await db.from("issues").update({ email_sent_at: new Date().toISOString() }).eq("id", issueId)
    const sent = await drainQueue()
    result.emailed = sent.sent
    result.queued = sent.queued
    if (sent.failed) result.emailError = sent.stoppedBy || `${sent.failed} failed`
  } catch (e) {
    // The issue stays published; the email can be retried from the Editor's Desk.
    result.emailError = (e as Error).message
  }
  return result
}

/** Sends the rendered issue to one address only (the editor), without publishing anything. */
export const sendTestEmail = async (issueId: string, to: string) => {
  const id = await enqueueTest(issueId, to)
  const result = await drainQueue({ ids: [id] })
  if (!result.sent) {
    const { data } = await supabaseAdmin().from("email_queue").select("error").eq("id", id).single()
    await supabaseAdmin().from("email_queue").update({ status: "failed" }).eq("id", id)
    throw new Error(data?.error || (result.quotaLeft ? "Test email failed" : "Today's email allowance is used up. Try again tomorrow."))
  }
  return result.sent
}

/**
 * Hourly scheduler: publishes every scheduled issue whose slot has arrived,
 * then sends whatever is still queued (welcome emails first) within the allowance.
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
  return { published: results, waiting, email: await drainQueue() }
}
