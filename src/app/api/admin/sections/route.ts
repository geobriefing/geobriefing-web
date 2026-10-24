import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { DESK_SECTIONS } from "@/lib/deskSections"

/** Marks a section reviewed, skipped, or reopens it. Body: { issueId, section, action }. */
export const POST = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const { issueId, section, action } = await req.json().catch(() => ({}))
  const def = DESK_SECTIONS.find(s => s.key === section)
  if (!issueId || !def) return NextResponse.json({ error: "issueId and a valid section are required" }, { status: 400 })

  const patch =
    action === "reviewed" ? { reviewed: true, skipped: false } :
    action === "skip" ? { reviewed: true, skipped: true } :
    action === "reopen" ? { reviewed: false, skipped: false } : null
  if (!patch) return NextResponse.json({ error: "action must be reviewed, skip or reopen" }, { status: 400 })
  if (action === "skip" && !def.skippable) return NextResponse.json({ error: `${def.label} can't be skipped` }, { status: 400 })

  const { error } = await supabaseAdmin().from("issue_section_review")
    .upsert({ issue_id: issueId, section_name: section, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "issue_id,section_name" })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
