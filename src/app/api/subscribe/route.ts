import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

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

    await resend.emails.send({
      from: "GeoBriefing <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to GeoBriefing",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FAFAF7; color: #1a1a1a;">
          <div style="border-top: 4px solid #1a1a1a; border-bottom: 1px solid #1a1a1a; padding: 20px 0; margin-bottom: 30px; text-align: center;">
            <h1 style="font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -1px;">GeoBriefing</h1>
            <p style="font-size: 10px; color: #888; letter-spacing: 4px; margin: 6px 0 0; font-family: Arial, sans-serif; text-transform: uppercase;">Spatial Intelligence · Global Edition</p>
          </div>

          <p style="font-size: 18px; font-weight: 700; margin-bottom: 16px;">You are in${name ? `, ${name}` : ""}.</p>

          <p style="font-size: 14px; line-height: 1.7; color: #444; font-family: Arial, sans-serif;">
            Welcome to GeoBriefing — your free weekly GIS intelligence publication.
            Every Monday you will get:
          </p>

          <ul style="font-size: 14px; line-height: 2; color: #444; font-family: Arial, sans-serif; padding-left: 20px;">
            <li>Curated GIS news from South Asia, Middle East, Central Asia and beyond</li>
            <li>Original GIS stories — history, wild true stories, unsung heroes</li>
            <li>Maps Don't Lie — one misleading or surprising map with commentary</li>
            <li>Five recurring comic strips</li>
            <li>Interactive games — Satellite Spot, GeoGuesser, GIS Crossword</li>
            <li>Upcoming GIS events and job listings</li>
          </ul>

          <p style="font-size: 14px; line-height: 1.7; color: #444; font-family: Arial, sans-serif;">
            Your first issue arrives next Monday. In the meantime, read the latest issue below.
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="https://geobriefing.vercel.app"
              style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">
              Read Latest Issue
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 20px;">
            <p style="font-size: 11px; color: #aaa; font-family: Arial, sans-serif; text-align: center;">
              GeoBriefing · Free, independent, no ads.<br>
              <a href="https://geobriefing.vercel.app/unsubscribe?email=${encodeURIComponent(email)}"
                style="color: #aaa;">Unsubscribe</a>
            </p>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
