import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { welcomeEmail } from "@/lib/emails/welcome"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings } from "@/lib/settings"
import { siteUrl, unsubscribeUrl } from "@/lib/site"

const resend = new Resend(process.env.RESEND_API_KEY)

export const POST = async (req: NextRequest) => {
  try {
    const { email: raw } = await req.json()
    const email = String(raw || "").toLowerCase().trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const db = supabaseAdmin()
    const { data: existing } = await db.from("subscribers").select("id, status").eq("email", email).maybeSingle()
    if (existing?.status === "active") {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }
    // A reader who unsubscribed and comes back is reactivated rather than refused.
    const { error: dbError } = existing
      ? await db.from("subscribers").update({ status: "active" }).eq("id", existing.id)
      : await db.from("subscribers").insert({ email, status: "active", confirmed: false })
    if (dbError) throw dbError

    // Schedule copy, sender and editor identity all come from Settings.
    const settings = await getSettings()
    await resend.emails.send({
      from: settings.fromAddress,
      to: email,
      replyTo: settings.editorContact || undefined,
      subject: "Welcome to GeoBriefing",
      html: welcomeEmail({
        siteUrl: siteUrl(),
        unsubscribeUrl: unsubscribeUrl(email),
        publishDay: settings.publishDay,
        editorName: settings.editorName,
        contactEmail: settings.editorContact,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
