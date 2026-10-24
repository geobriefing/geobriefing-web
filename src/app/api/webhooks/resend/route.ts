import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { secretHash } from "@/lib/site"
import { parseGuess, stripQuotedReply } from "@/lib/replies"

interface ResendEvent {
  type: string
  data: {
    email_id?: string
    from?: string
    to?: string[] | string
    subject?: string
    bounce?: { type?: string; subType?: string; message?: string }
  }
}

/**
 * Resend webhook. Point one webhook at /api/webhooks/resend with these events:
 *  - email.bounced:    a hard (permanent) bounce marks the subscriber "bounced";
 *                      soft bounces (mailbox full, etc.) are only logged on the queue row
 *  - email.complained: the reader marked it as spam, so they are marked "complained"
 *  - email.received:   a reply, stored against the issue it answers with any country guess
 * Bounced and complained addresses are never emailed again and can't re-subscribe.
 * Verifies the Svix signature with RESEND_WEBHOOK_SECRET.
 */
const markUndeliverable = async (event: ResendEvent) => {
  const db = supabaseAdmin()
  const { email_id, to, bounce } = event.data
  const addresses = (Array.isArray(to) ? to : [to || ""]).map(a => a.toLowerCase().trim()).filter(Boolean)
  const complaint = event.type === "email.complained"
  const permanent = complaint || !bounce?.type || /permanent|hard/i.test(bounce.type)
  const reason = complaint ? "marked as spam" : `bounced: ${[bounce?.type, bounce?.subType, bounce?.message].filter(Boolean).join(" / ")}`

  if (email_id) await db.from("email_queue").update({ error: reason.slice(0, 500) }).eq("resend_id", email_id)
  if (permanent && addresses.length) {
    const { error } = await db.from("subscribers")
      .update({ status: complaint ? "complained" : "bounced", status_changed_at: new Date().toISOString() })
      .in("email", addresses)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Anything still queued for them is dropped.
    await db.from("email_queue").update({ status: "skipped", error: reason.slice(0, 500) })
      .in("to_email", addresses).eq("status", "queued")
  }
  return NextResponse.json({ ok: true, removed: permanent ? addresses.length : 0 })
}

export const POST = async (req: NextRequest) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET is not set" }, { status: 503 })

  const payload = await req.text()
  const resend = new Resend(process.env.RESEND_API_KEY)
  let event: ResendEvent
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get("svix-id") || "",
        timestamp: req.headers.get("svix-timestamp") || "",
        signature: req.headers.get("svix-signature") || "",
      },
      webhookSecret: secret,
    }) as typeof event
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
  if (event.type === "email.bounced" || event.type === "email.complained") return markUndeliverable(event)
  if (event.type !== "email.received") return NextResponse.json({ ignored: event.type })

  const { email_id, from = "", subject = "" } = event.data
  let text = ""
  if (email_id) {
    const { data } = await resend.emails.receiving.get(email_id)
    text = data?.text || (data?.html || "").replace(/<[^>]+>/g, " ")
  }
  const body = stripQuotedReply(text).slice(0, 5000)

  const db = supabaseAdmin()
  // "Re: Issue #12: ..." → issue 12; otherwise the latest published issue.
  const number = Number(subject.match(/#(\d+)/)?.[1])
  const { data: issue } = number
    ? await db.from("issues").select("id, reply_prompt").eq("issue_number", number).maybeSingle()
    : await db.from("issues").select("id, reply_prompt").eq("status", "published")
        .order("issue_number", { ascending: false }).limit(1).maybeSingle()

  const address = (from.match(/<([^>]+)>/)?.[1] || from).toLowerCase().trim()
  const { error } = await db.from("replies").insert({
    issue_id: issue?.id ?? null,
    from_hash: secretHash(`reply:${address}`),
    body: body || "(empty)",
    guess: issue?.reply_prompt ? parseGuess(body) : null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
