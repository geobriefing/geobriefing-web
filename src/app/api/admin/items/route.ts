import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { EDITABLE, HAS_AI_DRAFT, SORTABLE } from "@/lib/deskSections"

type Action =
  | "approve" | "discard" | "restore" | "save" | "delete" | "create"
  | "reorder" | "set_lead" | "set_must_read" | "clear_must_read"

interface Body {
  table: string
  action: Action
  id?: string
  ids?: string[]
  issueId?: string
  patch?: Record<string, unknown>
}

const pick = (table: string, patch: Record<string, unknown> = {}) =>
  Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE[table]?.includes(k)))

/** Country desk lists are validated here as well as by the database's length checks. */
const validateDesk = (patch: Record<string, unknown>) => {
  if ("facts" in patch) {
    const facts = patch.facts
    if (!Array.isArray(facts) || facts.length > 5 || facts.some(f => typeof f?.key !== "string" || typeof f?.value !== "string")) {
      return "Facts must be a list of up to 5 {key, value} pairs"
    }
  }
  if ("follow" in patch) {
    const follow = patch.follow
    if (!Array.isArray(follow) || follow.length > 3 || follow.some(f => typeof f?.name !== "string" || typeof f?.why !== "string")) {
      return "Who to follow must be a list of up to 3 {name, why} entries"
    }
  }
  return null
}

/** GET ?table=sources: list rows of a non-issue table (used by the Content tab). */
export const GET = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const table = req.nextUrl.searchParams.get("table")
  if (table !== "sources") return NextResponse.json({ error: "Unsupported table" }, { status: 400 })
  const { data, error } = await supabaseAdmin().from("sources").select("*").order("group_name").order("sort_order")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data })
}

/** One review action on one item (or a reorder of several). */
export const POST = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  let body: Body
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  const { table, action, id } = body
  if (!EDITABLE[table]) return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 })

  const db = supabaseAdmin()
  const done = (error: { message: string } | null, extra: Record<string, unknown> = {}) =>
    error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true, ...extra })

  switch (action) {
    case "approve": {
      // Approving clears the AI-draft flag: the editor has now checked it.
      const patch: Record<string, unknown> = { status: "approved" }
      if (HAS_AI_DRAFT.has(table)) patch.ai_draft = false
      return done((await db.from(table).update(patch).eq("id", id)).error)
    }
    case "discard":
      return done((await db.from(table).update({ status: "discarded" }).eq("id", id)).error)
    case "restore":
      return done((await db.from(table).update({ status: "draft" }).eq("id", id)).error)
    case "save": {
      const patch = pick(table, body.patch)
      if (table === "country_desks") {
        const problem = validateDesk(patch)
        if (problem) return NextResponse.json({ error: problem }, { status: 400 })
      }
      if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to save" }, { status: 400 })
      return done((await db.from(table).update(patch).eq("id", id)).error)
    }
    case "create": {
      const patch = pick(table, body.patch)
      if (table === "country_desks") {
        const problem = validateDesk(patch)
        if (problem) return NextResponse.json({ error: problem }, { status: 400 })
      }
      const row: Record<string, unknown> = { ...patch }
      if (table !== "sources" && table !== "events") row.issue_id = body.issueId
      if (table !== "sources") row.status = "draft"
      if (table === "events") row.is_active = true
      const { data, error } = await db.from(table).insert(row).select().single()
      return done(error, { row: data })
    }
    case "delete":
      return done((await db.from(table).delete().eq("id", id)).error)
    case "reorder": {
      if (!SORTABLE.has(table) || !body.ids?.length) return NextResponse.json({ error: "Cannot reorder this section" }, { status: 400 })
      const results = await Promise.all(body.ids.map((rowId, i) => db.from(table).update({ sort_order: i }).eq("id", rowId)))
      return done(results.find(r => r.error)?.error ?? null)
    }
    case "set_lead": {
      if (table !== "stories" || !body.issueId) return NextResponse.json({ error: "Only news stories can be the lead" }, { status: 400 })
      await db.from("stories").update({ is_lead: false }).eq("issue_id", body.issueId)
      return done((await db.from("stories").update({ is_lead: true }).eq("id", id)).error)
    }
    case "set_must_read":
    case "clear_must_read": {
      // One must-read per issue: setting a new one replaces the old one.
      if (table !== "stories" || !body.issueId) return NextResponse.json({ error: "Only news stories can be the must-read" }, { status: 400 })
      const value = action === "set_must_read" ? id : null
      return done((await db.from("issues").update({ must_read_story_id: value }).eq("id", body.issueId)).error)
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
