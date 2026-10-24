import { NextRequest, NextResponse } from "next/server"
import { requireEditor } from "@/lib/adminAuth"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings } from "@/lib/settings"
import { gamesTeaserFrom, getLastWeekAnswers } from "@/lib/issue"
import { nextPublishSlot } from "@/lib/schedule"
import { DESK_SECTIONS } from "@/lib/deskSections"

/**
 * Everything the Editor's Desk shows for one issue (?issueId=, default: the
 * newest draft or scheduled issue): the issue list, every section's items in
 * every state (so the desk can show empty, AI-draft and discarded states),
 * review status, and the hooks bar.
 */
export const GET = async (req: NextRequest) => {
  const auth = await requireEditor(req)
  if (auth.error) return auth.error
  const db = supabaseAdmin()

  const { data: issues } = await db.from("issues")
    .select("id, issue_number, slug, headline, editor_note, status, published_at, scheduled_at, email_sent_at, reply_prompt, teaser, must_read_story_id, read_time_minutes")
    .order("issue_number", { ascending: false }).limit(12)
  const list = issues || []
  const wanted = req.nextUrl.searchParams.get("issueId")
  const issue = list.find(i => i.id === wanted) || list.find(i => i.status !== "published") || list[0] || null
  if (!issue) return NextResponse.json({ issues: [], issue: null })

  // Make sure every section has a review row (older issues predate some sections).
  if (issue.status !== "published") {
    await db.from("issue_section_review").upsert(
      DESK_SECTIONS.map(s => ({ issue_id: issue.id, section_name: s.key, reviewed: false, skipped: false })),
      { onConflict: "issue_id,section_name", ignoreDuplicates: true },
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const byIssue = (table: string, order = "sort_order") =>
    db.from(table).select("*").eq("issue_id", issue.id).order(order).order("created_at")

  const [
    review, stories, desks, gisStories, maps, comics, games, events, datasets, quotes, jokes, facts, features,
    settings, lastWeek, prevIssue,
  ] = await Promise.all([
    db.from("issue_section_review").select("*").eq("issue_id", issue.id),
    db.from("stories").select("*").eq("issue_id", issue.id)
      .order("is_lead", { ascending: false }).order("sort_order").order("relevance_score", { ascending: false }),
    byIssue("country_desks", "created_at"),
    byIssue("gis_stories", "created_at"),
    byIssue("maps_dont_lie", "created_at"),
    byIssue("comic_strips"),
    byIssue("games"),
    // Events aren't tied to one issue: every upcoming event is reviewable.
    db.from("events").select("*").gte("start_date", today).order("sort_order").order("start_date"),
    byIssue("datasets"),
    byIssue("quotes", "created_at"),
    byIssue("jokes"),
    byIssue("fun_facts"),
    byIssue("features", "created_at"),
    getSettings(),
    getLastWeekAnswers(issue.issue_number).catch(() => null),
    db.from("issues").select("id, issue_number").eq("status", "published").lt("issue_number", issue.issue_number)
      .order("issue_number", { ascending: false }).limit(1).maybeSingle(),
  ])

  const [{ count: replyCount }, { count: lastReplyCount }] = await Promise.all([
    db.from("replies").select("id", { count: "exact", head: true }).eq("issue_id", issue.id),
    prevIssue.data
      ? db.from("replies").select("id", { count: "exact", head: true }).eq("issue_id", prevIssue.data.id)
      : Promise.resolve({ count: 0 }),
  ])

  const gameRows = games.data || []
  const has = (t: string) => gameRows.some(g => g.game_type === t && g.status === "approved")
  const teaser = gamesTeaserFrom(lastWeek, {
    satellite: has("satellite_spot") ? { id: "", game_type: "satellite_spot", data: {} } : null,
    geoguesser: has("geoguesser") ? { id: "", game_type: "geoguesser", data: {} } : null,
    crossword: has("crossword") ? { id: "", game_type: "crossword", data: {} } : null,
  })
  const storyRows = stories.data || []
  const mustRead = storyRows.find(s => s.id === issue.must_read_story_id) || null

  return NextResponse.json({
    issues: list,
    issue,
    review: review.data || [],
    sections: {
      news: storyRows,
      country_desk: desks.data || [],
      gis_story: gisStories.data || [],
      maps_dont_lie: maps.data || [],
      comics: comics.data || [],
      games: gameRows,
      events: events.data || [],
      data_drops: datasets.data || [],
      quote: quotes.data || [],
      jokes: jokes.data || [],
      fun_facts: facts.data || [],
      features: features.data || [],
    },
    hooks: {
      mustRead: mustRead ? { id: mustRead.id, title: mustRead.title } : null,
      gamesTeaser: teaser,
      lastWeekPlays: lastWeek?.players ?? 0,
      replyPrompt: issue.reply_prompt || "",
      replyCount: replyCount || 0,
      lastIssueReplyCount: lastReplyCount || 0,
    },
    schedule: {
      publishDay: settings.publishDay,
      publishTime: settings.publishTime,
      timezone: settings.timezone,
      nextSlot: nextPublishSlot(new Date(issue.scheduled_at || Date.now()), settings).toISOString(),
    },
  })
}
