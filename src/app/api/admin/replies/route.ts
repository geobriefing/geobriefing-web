import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

/** Reader replies for one issue (?issueId=), newest first, with a tally of country guesses. */
export const GET = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const issueId = req.nextUrl.searchParams.get("issueId")
  if (!issueId) return NextResponse.json({ error: "issueId is required" }, { status: 400 })
  const { data, error } = await supabaseAdmin().from("replies")
    .select("id, body, guess, created_at").eq("issue_id", issueId).order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const guesses = (data || []).reduce<Record<string, number>>((acc, r) => {
    if (r.guess) acc[r.guess] = (acc[r.guess] || 0) + 1
    return acc
  }, {})
  return NextResponse.json({ replies: data, count: data?.length || 0, guesses })
}
