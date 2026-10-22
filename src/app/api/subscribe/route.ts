import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { welcomeEmail } from "@/lib/emails/welcome"

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
)

export const POST = async (req: NextRequest) => {
  try {
    const { email } = await req.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const { error: dbError } = await supabase
      .from("subscribers")
      .insert({
        email: email.toLowerCase().trim(),
        status: "active",
        confirmed: false,
      })

    if (dbError) {
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
      }
      throw dbError
    }

    const { data: settingsRows } = await supabase
      .from("site_settings")
      .select("id, value")
      .in("id", ["publish_day", "editor_name", "editor_contact"])
    const settings: Record<string, string> = {}
    ;(settingsRows || []).forEach((r: { id: string; value: string }) => { settings[r.id] = r.value })

    await resend.emails.send({
      from: "GeoBriefing <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to GeoBriefing",
      html: welcomeEmail({
        siteUrl: "https://geobriefing.vercel.app",
        email,
        publishDay: settings["publish_day"] || "Sunday",
        editorName: settings["editor_name"] || "",
        contactEmail: settings["editor_contact"] || "",
      }),
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}