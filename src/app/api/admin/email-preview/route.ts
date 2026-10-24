import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { getIssue } from "@/lib/issue"
import { getSettings } from "@/lib/settings"
import { renderIssueEmail } from "@/lib/emails/issue"

/** The weekly email for ?slug= as it would be sent now, as HTML. */
export const GET = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const ref = req.nextUrl.searchParams.get("slug")
  if (!ref) return NextResponse.json({ error: "slug is required" }, { status: 400 })
  const [data, settings] = await Promise.all([getIssue(ref, { includeUnpublished: true }), getSettings()])
  if (!data) return NextResponse.json({ error: "Issue not found" }, { status: 404 })
  const { subject, html } = renderIssueEmail(data, settings, { unsubscribeUrl: "#unsubscribe-preview" })
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "x-email-subject": encodeURIComponent(subject) } })
}
