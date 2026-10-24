import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { secretHash } from "@/lib/site"
import { parseGuess, stripQuotedReply } from "@/lib/replies"

/**
 * Inbound reply webhook (Resend `email.received`).
 * Verifies the Svix signature with RESEND_WEBHOOK_SECRET, fetches the message body,
 * stores it as a Reply against the issue it answers, and extracts a country guess.
 * The sender address is stored only as a hash.
 */
export const POST = async (req: NextRequest) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET is not set" }, { status: 503 })

  const payload = await req.text()
  const resend = new Resend(process.env.RESEND_API_KEY)
  let event: { type: string; data: { email_id?: string; from?: string; subject?: string } }
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
