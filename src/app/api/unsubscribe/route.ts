import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { verifyUnsubscribe } from "@/lib/site"

/** One-click unsubscribe from the signed link in every email. */
const unsubscribe = async (req: NextRequest) => {
  const email = req.nextUrl.searchParams.get("e") || ""
  const token = req.nextUrl.searchParams.get("t") || ""
  if (!email || !verifyUnsubscribe(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 })
  }
  await supabaseAdmin().from("subscribers").update({ status: "unsubscribed" }).eq("email", email.toLowerCase().trim())
  return req.method === "POST"
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/unsubscribed", req.url), 303)
}

export const GET = unsubscribe
// Mail clients send POST for List-Unsubscribe-Post one-click unsubscribes.
export const POST = unsubscribe
