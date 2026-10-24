import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings } from "@/lib/settings"
import { DESK_SECTIONS } from "@/lib/deskSections"
import { nextPublishSlot } from "@/lib/schedule"
import { publishIssue, sendTestEmail } from "@/lib/publish"

const UPDATABLE = ["headline", "editor_note", "reply_prompt", "teaser"]

/**
 * Issue actions from the Editor's Desk. Body: { action, patch? }
 *  - update:       headline, editor_note, reply_prompt, teaser
 *  - schedule:     every section reviewed or skipped -> status scheduled; the hourly
 *                  scheduler publishes it at the next publish slot from Settings
 *  - unschedule:   back to draft
 *  - publish_now:  publish and email immediately
 *  - resend_email: retry the email for a published issue whose send failed
 *  - test_email:   send the rendered issue to the editor's own address only
 */
export const POST = async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const { id } = await ctx.params
  const { action, patch } = await req.json().catch(() => ({} as { action?: string; patch?: Record<string, unknown> }))
  const db = supabaseAdmin()

  const { data: issue } = await db.from("issues").select("*").eq("id", id).maybeSingle()
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 })

  const allReviewed = async () => {
    const { data } = await db.from("issue_section_review").select("section_name, reviewed").eq("issue_id", id)
    const done = new Set((data || []).filter(r => r.reviewed).map(r => r.section_name))
    return DESK_SECTIONS.filter(s => !done.has(s.key)).map(s => s.label)
  }

  try {
    switch (action) {
      case "update": {
        const clean = Object.fromEntries(Object.entries(patch || {}).filter(([k]) => UPDATABLE.includes(k)))
        const { error } = await db.from("issues").update(clean).eq("id", id)
        if (error) throw error
        return NextResponse.json({ ok: true })
      }
      case "schedule": {
        const missing = await allReviewed()
        if (missing.length) return NextResponse.json({ error: `Still to review: ${missing.join(", ")}` }, { status: 400 })
        const now = new Date()
        const { error } = await db.from("issues").update({ status: "scheduled", scheduled_at: now.toISOString() }).eq("id", id)
        if (error) throw error
        return NextResponse.json({ ok: true, slot: nextPublishSlot(now, await getSettings()).toISOString() })
      }
      case "unschedule": {
        const { error } = await db.from("issues").update({ status: "draft", scheduled_at: null }).eq("id", id)
        if (error) throw error
        return NextResponse.json({ ok: true })
      }
      case "publish_now": {
        const missing = await allReviewed()
        if (missing.length) return NextResponse.json({ error: `Still to review: ${missing.join(", ")}` }, { status: 400 })
        return NextResponse.json({ ok: true, ...(await publishIssue(id)) })
      }
      case "resend_email": {
        if (issue.status !== "published") return NextResponse.json({ error: "Publish the issue first" }, { status: 400 })
        if (issue.email_sent_at) return NextResponse.json({ error: "This issue has already been emailed" }, { status: 400 })
        return NextResponse.json({ ok: true, ...(await publishIssue(id)) })
      }
      case "test_email": {
        const to = (await getSettings()).editorContact
        if (!to) return NextResponse.json({ error: "Add a contact email in Settings first" }, { status: 400 })
        return NextResponse.json({ ok: true, sent: await sendTestEmail(id, to), to })
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
