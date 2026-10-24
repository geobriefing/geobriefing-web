import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getSettings } from "@/lib/settings"
import { readTime } from "@/lib/format"
import { geoguesserAnswer, publicGameData, satelliteAnswer, type GameRow, type GameType } from "@/lib/games"

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface IssueRow {
  id: string
  issue_number: number
  slug: string
  headline: string
  editor_note: string | null
  published_at: string | null
  status: "draft" | "scheduled" | "published"
  must_read_story_id: string | null
  reply_prompt: string | null
  teaser: string | null
  read_time_minutes: number | null
  scheduled_at: string | null
  email_sent_at: string | null
}
export interface Story {
  id: string; title: string; summary: string | null; region: string; topic: string | null
  source_name: string | null; source_url: string; is_lead: boolean; sort_order: number
}
export interface Joke { id: string; setup: string; punchline: string }
export interface Fact { id: string; fact: string; source: string | null; source_url: string | null }
export interface Quote { quote_text: string; quote_author: string; quote_role: string | null; source_url: string | null }
export interface GisStory { id: string; title: string; content: string; story_type: string | null; source_title: string | null; source_url: string | null }
export interface MapItem { id: string; title: string; commentary: string; map_type: string; image_url: string | null; source_url: string | null; image_credit: string | null }
export interface Comic { id: string; title: string; image_url: string | null; comic_series: { title: string } | null }
export interface EventItem {
  id: string; name: string; organizer: string | null; location: string | null; start_date: string
  end_date: string | null; event_type: string | null; is_free: boolean; is_online: boolean; url: string
}
export interface Dataset {
  id: string; name: string; publisher: string | null; region: string | null; format: string
  licence: string | null; resolution: string | null; url: string; link_status: "ok" | "broken"
}
export interface CountryDesk {
  id: string; country: string; region: string; intro: string; desk_number: number | null
  facts: { key: string; value: string }[]; follow: { name: string; why: string }[]
  source_languages: string[]; source_urls: string[]
}
export interface Feature { id: string; title: string; type: string; author_name: string; body_markdown: string }
export interface PublicGame { id: string; game_type: GameType; data: Record<string, unknown> }

export interface LastWeekGame {
  type: GameType
  label: string
  answer: string
  plays: number
  pctCorrect: number | null
  medianKm: number | null
  closestKm: number | null
}
export interface LastWeekAnswers {
  issueNumber: number
  slug: string
  players: number
  games: LastWeekGame[]
}
export interface GamesTeaser {
  lastAnswer: string | null
  pctCorrect: number | null
  plays: number
  thisWeek: string
}

export type SectionId = "news" | "country" | "story" | "feature" | "maps" | "comics" | "games" | "events" | "data"
export interface Section { id: SectionId; n: number; title: string; nav: string }

export interface IssueData {
  issue: IssueRow
  readTimeMinutes: number
  replyCount: number
  quote: Quote | null
  stories: Story[]
  mustRead: Story | null
  countryDesk: CountryDesk | null
  gisStory: GisStory | null
  feature: Feature | null
  map: MapItem | null
  comics: Comic[]
  games: { satellite: PublicGame | null; geoguesser: PublicGame | null; crossword: PublicGame | null }
  events: EventItem[]
  datasets: Dataset[]
  jokes: Joke[]
  facts: Fact[]
  lastWeek: LastWeekAnswers | null
  gamesTeaser: GamesTeaser | null
  sections: Section[]
}

const GAME_LABELS: Record<GameType, string> = {
  satellite_spot: "Satellite Spot",
  geoguesser: "GeoGuesser",
  crossword: "Crossword",
}

const SECTION_TITLES: Record<SectionId, [string, string]> = {
  news: ["GIS News Digest", "News"],
  country: ["Country desk", "Country desk"],
  story: ["GIS Story", "Story"],
  feature: ["Feature", "Feature"],
  maps: ["Maps Don't Lie", "Maps"],
  comics: ["Comics", "Comics"],
  games: ["Games", "Games"],
  events: ["Upcoming events", "Events"],
  data: ["Data drops", "Data drops"],
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// ─────────────────────────────────────────
// Read time
// ─────────────────────────────────────────

/** Minutes to read the approved content of an issue. Stored on publish as read_time_minutes. */
export const computeReadTime = (d: Pick<IssueData, "issue" | "stories" | "gisStory" | "feature" | "map" | "countryDesk" | "jokes" | "facts" | "quote" | "datasets">) =>
  readTime([
    d.issue.editor_note,
    d.quote?.quote_text,
    ...d.stories.flatMap(s => [s.title, s.summary]),
    d.gisStory?.content,
    d.feature?.body_markdown,
    d.map?.commentary,
    d.countryDesk?.intro,
    ...(d.countryDesk?.facts || []).map(f => `${f.key} ${f.value}`),
    ...d.jokes.map(j => `${j.setup} ${j.punchline}`),
    ...d.facts.map(f => f.fact),
    ...d.datasets.map(x => x.name),
  ])

// ─────────────────────────────────────────
// Last week's answers and the games teaser
// ─────────────────────────────────────────

/** Answers and play stats for the issue before `issueNumber`. Counts are computed, never stored. */
export const getLastWeekAnswers = async (issueNumber: number): Promise<LastWeekAnswers | null> => {
  const db = supabaseAdmin()
  const { data: prev } = await db.from("issues").select("id, issue_number, slug")
    .eq("status", "published").lt("issue_number", issueNumber)
    .order("issue_number", { ascending: false }).limit(1).maybeSingle()
  if (!prev) return null

  const { data: gameRows } = await db.from("games").select("*").eq("issue_id", prev.id).eq("status", "approved")
  const games = (gameRows || []) as GameRow[]
  if (!games.length) return null

  const { data: playRows } = await db.from("game_plays").select("game_id, is_correct, distance_km, day_hash").eq("issue_id", prev.id)
  const plays = playRows || []

  const order: GameType[] = ["satellite_spot", "geoguesser", "crossword"]
  const result: LastWeekGame[] = games
    .sort((a, b) => order.indexOf(a.game_type) - order.indexOf(b.game_type))
    .map(g => {
      const mine = plays.filter(p => p.game_id === g.id)
      const correct = mine.filter(p => p.is_correct).length
      const pctCorrect = mine.length ? Math.round((correct / mine.length) * 100) : null
      if (g.game_type === "geoguesser") {
        const distances = mine.map(p => p.distance_km).filter((x): x is number => typeof x === "number")
        return {
          type: g.game_type, label: GAME_LABELS[g.game_type], answer: geoguesserAnswer(g)?.name || "—",
          plays: mine.length, pctCorrect: null, medianKm: median(distances),
          closestKm: distances.length ? Math.min(...distances) : null,
        }
      }
      return {
        type: g.game_type, label: GAME_LABELS[g.game_type],
        answer: g.game_type === "satellite_spot" ? satelliteAnswer(g) || "—" : String(g.data?.title || "Solved grid"),
        plays: mine.length, pctCorrect, medianKm: null, closestKm: null,
      }
    })

  return {
    issueNumber: prev.issue_number,
    slug: prev.slug,
    players: new Set(plays.map(p => p.day_hash)).size,
    games: result,
  }
}

/** The games cell of the hooks strip: last week's Satellite Spot answer plus this week's puzzles. */
export const gamesTeaserFrom = (lastWeek: LastWeekAnswers | null, games: IssueData["games"]): GamesTeaser | null => {
  const count = [games.satellite, games.geoguesser, games.crossword].filter(Boolean).length
  if (!count && !lastWeek) return null
  const sat = lastWeek?.games.find(g => g.type === "satellite_spot") || lastWeek?.games[0] || null
  return {
    lastAnswer: sat?.answer ?? null,
    pctCorrect: sat?.pctCorrect ?? null,
    plays: sat?.plays ?? 0,
    thisWeek: count === 0 ? "" : count === 1 ? "A new puzzle this week." : `${count} new puzzles this week.`,
  }
}

// ─────────────────────────────────────────
// getIssue
// ─────────────────────────────────────────

/**
 * One issue with every approved section. `ref` is an issue number or a slug.
 * Public pages use the anon client (published issues only). Admin preview and the
 * email sender pass `{ includeUnpublished: true }`, which uses the service client.
 * Either way only approved items are included, so a preview matches what readers get.
 */
export const getIssue = async (
  ref: number | string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<IssueData | null> => {
  const db: SupabaseClient = opts.includeUnpublished ? supabaseAdmin() : supabase
  let q = db.from("issues").select("*")
  q = typeof ref === "number" ? q.eq("issue_number", ref) : q.eq("slug", ref)
  if (!opts.includeUnpublished) q = q.eq("status", "published")
  const { data: issue } = await q.maybeSingle()
  if (!issue) return null
  const id = issue.id
  const since = (issue.published_at ? new Date(issue.published_at) : new Date()).toISOString().split("T")[0]

  const [
    { data: stories }, { data: jokes }, { data: facts }, { data: quote }, { data: gisStory }, { data: map },
    { data: comics }, { data: games }, { data: events }, { data: datasets }, { data: desk }, lastWeek, replyCount, { data: feature },
  ] = await Promise.all([
    db.from("stories").select("id,title,summary,region,topic,source_name,source_url,is_lead,sort_order")
      .eq("issue_id", id).eq("status", "approved")
      .order("is_lead", { ascending: false }).order("sort_order").order("relevance_score", { ascending: false }),
    db.from("jokes").select("id,setup,punchline").eq("issue_id", id).eq("status", "approved").order("sort_order"),
    db.from("fun_facts").select("id,fact,source,source_url").eq("issue_id", id).eq("status", "approved").order("sort_order"),
    db.from("quotes").select("quote_text,quote_author,quote_role,source_url").eq("issue_id", id).eq("status", "approved").limit(1).maybeSingle(),
    db.from("gis_stories").select("id,title,content,story_type,source_title,source_url").eq("issue_id", id).eq("status", "approved").limit(1).maybeSingle(),
    db.from("maps_dont_lie").select("id,title,commentary,map_type,image_url,source_url,image_credit").eq("issue_id", id).eq("status", "approved").limit(1).maybeSingle(),
    db.from("comic_strips").select("id,title,image_url,comic_series(title)").eq("issue_id", id).eq("status", "approved").order("sort_order"),
    db.from("games").select("*").eq("issue_id", id).eq("status", "approved"),
    db.from("events").select("id,name,organizer,location,start_date,end_date,event_type,is_free,is_online,url")
      .eq("is_active", true).eq("status", "approved").gte("start_date", since).order("start_date").limit(8),
    db.from("datasets").select("id,name,publisher,region,format,licence,resolution,url,link_status")
      .eq("issue_id", id).eq("status", "approved").order("sort_order").order("created_at"),
    db.from("country_desks").select("*").eq("issue_id", id).eq("status", "approved").maybeSingle(),
    getLastWeekAnswers(issue.issue_number).catch(() => null),
    supabaseAdmin().from("replies").select("id", { count: "exact", head: true }).eq("issue_id", id)
      .then(r => r.count || 0, () => 0),
    db.from("features").select("id,title,type,author_name,body_markdown").eq("issue_id", id).eq("status", "approved").limit(1).maybeSingle(),
  ])

  const gameRows = (games || []) as GameRow[]
  const pub = (t: GameType): PublicGame | null => {
    const g = gameRows.find(x => x.game_type === t)
    return g ? { id: g.id, game_type: g.game_type, data: publicGameData(g) } : null
  }
  const storyList = (stories || []) as Story[]
  const gamesOut = { satellite: pub("satellite_spot"), geoguesser: pub("geoguesser"), crossword: pub("crossword") }

  const data: IssueData = {
    issue: issue as IssueRow,
    readTimeMinutes: 0,
    replyCount: replyCount as number,
    quote: (quote as Quote) || null,
    stories: storyList,
    // The editor's must-read pick; until one is set, the lead story stands in.
    mustRead: storyList.find(s => s.id === issue.must_read_story_id) || storyList.find(s => s.is_lead) || null,
    countryDesk: (desk as CountryDesk) || null,
    gisStory: (gisStory as GisStory) || null,
    feature: (feature as Feature) || null,
    map: (map as MapItem) || null,
    comics: (comics || []) as unknown as Comic[],
    games: gamesOut,
    events: (events || []) as EventItem[],
    datasets: (datasets || []) as Dataset[],
    jokes: (jokes || []) as Joke[],
    facts: (facts || []) as Fact[],
    lastWeek,
    gamesTeaser: gamesTeaserFrom(lastWeek, gamesOut),
    sections: [],
  }
  data.readTimeMinutes = issue.read_time_minutes || computeReadTime(data)

  const present: Record<SectionId, boolean> = {
    news: data.stories.length > 0,
    country: !!data.countryDesk,
    story: !!data.gisStory,
    feature: !!data.feature,
    maps: !!data.map,
    comics: data.comics.length > 0,
    games: !!(gamesOut.satellite || gamesOut.geoguesser || gamesOut.crossword),
    events: data.events.length > 0,
    data: data.datasets.length > 0,
  }
  // Empty sections are left out and the numbering closes up.
  data.sections = (Object.keys(SECTION_TITLES) as SectionId[])
    .filter(s => present[s])
    .map((s, i) => ({ id: s, n: i + 1, title: SECTION_TITLES[s][0], nav: SECTION_TITLES[s][1] }))

  return data
}

/** The latest published issue number, or null when nothing has been published. */
export const latestIssueNumber = async (): Promise<number | null> => {
  const { data } = await supabase.from("issues").select("issue_number").eq("status", "published")
    .order("issue_number", { ascending: false }).limit(1).maybeSingle()
  return data?.issue_number ?? null
}

// ─────────────────────────────────────────
// Archive and stats (all computed)
// ─────────────────────────────────────────

export interface ArchiveIssue { id: string; issue_number: number; slug: string; headline: string; published_at: string | null }

/** Published issues grouped by month in the configured timezone, newest first. */
export const getArchive = async () => {
  const [{ data }, settings] = await Promise.all([
    supabase.from("issues").select("id, issue_number, slug, headline, published_at")
      .eq("status", "published").order("issue_number", { ascending: false }),
    getSettings(),
  ])
  const issues = (data || []) as ArchiveIssue[]
  const fmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: settings.timezone })
  const groups: { month: string; items: ArchiveIssue[] }[] = []
  issues.forEach(i => {
    const month = i.published_at ? fmt.format(new Date(i.published_at)) : "Undated"
    const last = groups[groups.length - 1]
    if (last?.month === month) last.items.push(i)
    else groups.push({ month, items: [i] })
  })
  const first = issues[issues.length - 1]
  return {
    groups,
    totalIssues: issues.length,
    firstIssueDate: first?.published_at ?? null,
  }
}

/** Subscriber count, issue totals and per-issue reply and play counts. Server only. */
export const getStats = async (issueIds: string[] = []) => {
  const db = supabaseAdmin()
  const [{ count: subscribers }, archive, { data: replies }, { data: plays }] = await Promise.all([
    db.from("subscribers").select("id", { count: "exact", head: true }).eq("status", "active"),
    getArchive(),
    issueIds.length ? db.from("replies").select("issue_id").in("issue_id", issueIds) : Promise.resolve({ data: [] }),
    issueIds.length ? db.from("game_plays").select("issue_id").in("issue_id", issueIds) : Promise.resolve({ data: [] }),
  ])
  const countBy = (rows: { issue_id: string }[] | null) =>
    (rows || []).reduce<Record<string, number>>((acc, r) => { acc[r.issue_id] = (acc[r.issue_id] || 0) + 1; return acc }, {})
  return {
    subscribers: subscribers || 0,
    totalIssues: archive.totalIssues,
    firstIssueDate: archive.firstIssueDate,
    repliesByIssue: countBy(replies as { issue_id: string }[]),
    playsByIssue: countBy(plays as { issue_id: string }[]),
  }
}
