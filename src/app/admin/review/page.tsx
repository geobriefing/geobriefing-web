"use client"
import { useState, useEffect, useCallback } from "react"
import AdminHeader from "@/components/AdminHeader"
import { RegionPill, TypePill } from "@/components/Pills"
import { AdminLoading, BigBtn, Btn, Chip, Notice, StatusText, softInputCls } from "@/components/AdminUI"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"
import { formatDate } from "@/lib/format"

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type SectionName =
  | "quote" | "news" | "events" | "features" | "gis_story"
  | "maps_dont_lie" | "jokes" | "fun_facts" | "games" | "comics"

interface Issue {
  id: string
  issue_number: number
  headline: string
  editor_note: string | null
  status: string
  published_at: string | null
}

interface ReviewRow {
  id: string
  issue_id: string
  section_name: SectionName
  reviewed: boolean
  skipped: boolean
}

interface Story {
  id: string; title: string; summary: string; source_name: string; scraped_at: string | null
  region: string; topic: string; status: string; is_lead: boolean
}
interface EventItem {
  id: string; name: string; description: string; start_date: string
  location: string; status: string; event_type: string | null
}
interface Quote { id: string; quote_text: string; quote_author: string; quote_role: string; status: string }
interface Joke { id: string; setup: string; punchline: string; topic: string; status: string }
interface Fact { id: string; fact: string; source: string; topic: string; status: string }
interface GisStory { id: string; title: string; content: string; story_type: string; status: string }
interface MapItem { id: string; title: string; commentary: string; map_type: string; image_url: string | null; status: string }
interface Game { id: string; game_type: string; data: Record<string, unknown>; status: string }
interface ComicStrip { id: string; title: string; image_url: string | null; status: string }
interface Feature {
  id: string; title: string; type: string; author_name: string
  body_markdown: string; is_ai_suggested: boolean; approved_as_is: boolean; status: string
}

// Sections in the order they appear in the issue, then the extras.
const SECTION_ORDER: SectionName[] = [
  "news", "gis_story", "maps_dont_lie", "comics", "games", "events",
  "quote", "jokes", "fun_facts", "features",
]

const SECTION_LABELS: Record<SectionName, string> = {
  news: "GIS News",
  gis_story: "GIS Story",
  maps_dont_lie: "Maps Don't Lie",
  comics: "Comics",
  games: "Games",
  events: "Events",
  quote: "Quote of the week",
  jokes: "Jokes",
  fun_facts: "Fun facts",
  features: "Features",
}

// Sections that can be left out of an issue.
const SKIPPABLE: SectionName[] = ["events", "features", "jokes", "fun_facts", "comics", "games", "maps_dont_lie"]

const FEATURE_TYPES = ["Interview", "Concept Explainer", "Book & Paper Review", "App & Tool Review", "Opinion"]

// ─────────────────────────────────────────
// Item card
// ─────────────────────────────────────────

const ItemCard = ({
  status, lead = false, aiDraft = false, badges, meta, children, actions,
}: {
  status: string
  lead?: boolean
  aiDraft?: boolean
  badges?: React.ReactNode
  meta?: React.ReactNode
  children: React.ReactNode
  actions: React.ReactNode
}) => {
  const bar = lead ? "border-l-accent" :
    status === "approved" ? "border-l-[#A9D1B8]" :
    status === "discarded" ? "border-l-[#E5B3A8]" : "border-l-[#E2C98A]"
  return (
    <div className={`bg-card border border-hair border-l-[3px] ${bar} mt-3.5 px-4 py-4 sm:px-[18px] ${status === "discarded" ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap justify-between gap-3 items-center mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          {aiDraft && (
            <span className="font-mono font-semibold text-[10px] leading-none tracking-[.04em] px-1.5 py-1 bg-ink text-paper">AI DRAFT</span>
          )}
          {lead && (
            <span className="font-sans font-bold text-[10px] leading-none tracking-meta uppercase px-[7px] py-1 bg-accent text-paper">★ Lead</span>
          )}
          {badges}
          {meta && <span className="font-sans font-medium text-xs text-meta">{meta}</span>}
        </div>
        <StatusText status={status} />
      </div>
      <div className="flex flex-col gap-2">{children}</div>
      <div className="flex flex-wrap gap-2 mt-3">{actions}</div>
    </div>
  )
}

const titleInputCls = `${softInputCls} font-display font-semibold text-h3 leading-[1.3]`
const bodyInputCls = `${softInputCls} font-sans text-base sm:text-[15px] leading-[1.55] text-ink-2 resize-y`

// Items from the weekly pipeline are AI drafts until the editor approves them.
const isAiDraft = (status: string) => status === "draft"

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

const EditorsDeskPage = () => {
  const { ready, logout } = useAdminAuth()

  const [issues, setIssues] = useState<Issue[]>([])
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])
  const [activeTab, setActiveTab] = useState<SectionName>("news")
  const [message, setMessage] = useState("")
  const [loadingIssue, setLoadingIssue] = useState(true)
  const [publishing, setPublishing] = useState(false)

  const [stories, setStories] = useState<Story[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [quote, setQuote] = useState<Quote | null>(null)
  const [jokes, setJokes] = useState<Joke[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [gisStory, setGisStory] = useState<GisStory | null>(null)
  const [mapItem, setMapItem] = useState<MapItem | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [comics, setComics] = useState<ComicStrip[]>([])
  const [feature, setFeature] = useState<Feature | null>(null)

  // ── Load the list of draft issues, default to the most recent draft ──
  useEffect(() => {
    if (!ready) return
    const loadIssues = async () => {
      const { data } = await supabase
        .from("issues")
        .select("id, issue_number, headline, editor_note, status, published_at")
        .order("issue_number", { ascending: false })
        .limit(10)
      setIssues(data || [])
      const firstDraft = (data || []).find(i => i.status === "draft") || (data || [])[0] || null
      setCurrentIssue(firstDraft)
      setLoadingIssue(false)
    }
    loadIssues()
  }, [ready])

  // ── Load everything for the selected issue ──
  const loadIssueContent = useCallback(async () => {
    if (!currentIssue) return
    const issueId = currentIssue.id

    const [
      { data: reviewData },
      { data: storiesData },
      { data: eventsData },
      { data: quoteData },
      { data: jokesData },
      { data: factsData },
      { data: gisStoryData },
      { data: mapData },
      { data: gamesData },
      { data: comicsData },
      { data: featureData },
    ] = await Promise.all([
      supabase.from("issue_section_review").select("*").eq("issue_id", issueId),
      supabase.from("stories").select("*").eq("issue_id", issueId).order("relevance_score", { ascending: false }),
      supabase.from("events").select("*").eq("issue_id", issueId),
      supabase.from("quotes").select("*").eq("issue_id", issueId).limit(1).maybeSingle(),
      supabase.from("jokes").select("*").eq("issue_id", issueId),
      supabase.from("fun_facts").select("*").eq("issue_id", issueId),
      supabase.from("gis_stories").select("*").eq("issue_id", issueId).limit(1).maybeSingle(),
      supabase.from("maps_dont_lie").select("*").eq("issue_id", issueId).limit(1).maybeSingle(),
      supabase.from("games").select("*").eq("issue_id", issueId),
      supabase.from("comic_strips").select("*").eq("issue_id", issueId),
      supabase.from("features").select("*").eq("issue_id", issueId).limit(1).maybeSingle(),
    ])

    setReviewRows(reviewData || [])
    setStories(storiesData || [])
    setEvents(eventsData || [])
    setQuote(quoteData || null)
    setJokes(jokesData || [])
    setFacts(factsData || [])
    setGisStory(gisStoryData || null)
    setMapItem(mapData || null)
    setGames(gamesData || [])
    setComics(comicsData || [])
    setFeature(featureData || null)
  }, [currentIssue])

  useEffect(() => {
    // Fetching the selected issue's content is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentIssue) loadIssueContent()
  }, [currentIssue, loadIssueContent])

  // ── Review row helpers ──
  const getRow = (section: SectionName) => reviewRows.find(r => r.section_name === section)

  const setSectionFlag = async (section: SectionName, patch: Partial<Pick<ReviewRow, "reviewed" | "skipped">>) => {
    if (!currentIssue) return
    const row = getRow(section)
    if (!row) { setMessage("Error: this issue has no review row for that section. Re-run the digest builder."); return }
    const { error } = await supabase.from("issue_section_review").update(patch).eq("id", row.id)
    if (error) { setMessage("Error: " + error.message); return }
    setReviewRows(rows => rows.map(r => r.id === row.id ? { ...r, ...patch } : r))
  }

  const markReviewed = (section: SectionName) => setSectionFlag(section, { reviewed: true, skipped: false })
  const skipSection = (section: SectionName) => setSectionFlag(section, { reviewed: true, skipped: true })
  const reopenSection = (section: SectionName) => setSectionFlag(section, { reviewed: false, skipped: false })

  const allSectionsReviewed = SECTION_ORDER.every(s => getRow(s)?.reviewed)
  const reviewedCount = SECTION_ORDER.filter(s => getRow(s)?.reviewed).length

  // ── Publish ──
  const publishIssue = async () => {
    if (!currentIssue || !allSectionsReviewed) return
    setPublishing(true)
    setMessage("")
    const { error } = await supabase
      .from("issues")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", currentIssue.id)
    setPublishing(false)
    if (error) { setMessage("Error: " + error.message); return }
    setMessage(`Issue #${currentIssue.issue_number} is now live.`)
    setCurrentIssue({ ...currentIssue, status: "published" })
    setIssues(prev => prev.map(i => i.id === currentIssue.id ? { ...i, status: "published" } : i))
  }

  // ── Generic item actions ──
  const setItemStatus = async (table: string, id: string, status: string) => {
    await supabase.from(table).update({ status }).eq("id", id)
    await loadIssueContent()
  }

  const setLeadStory = async (id: string) => {
    if (!currentIssue) return
    await supabase.from("stories").update({ is_lead: false }).eq("issue_id", currentIssue.id)
    await supabase.from("stories").update({ is_lead: true }).eq("id", id)
    await loadIssueContent()
  }

  const updateStoryText = (id: string, patch: Partial<Story>) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  const saveStory = async (story: Story) => {
    await supabase.from("stories").update({ title: story.title, summary: story.summary }).eq("id", story.id)
    setMessage("Story saved.")
  }

  const updateEventText = (id: string, patch: Partial<EventItem>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }
  const saveEvent = async (ev: EventItem) => {
    await supabase.from("events").update({ name: ev.name, description: ev.description }).eq("id", ev.id)
    setMessage("Event saved.")
  }

  const saveQuote = async () => {
    if (!quote) return
    await supabase.from("quotes").update({
      quote_text: quote.quote_text, quote_author: quote.quote_author, quote_role: quote.quote_role,
    }).eq("id", quote.id)
    setMessage("Quote saved.")
  }

  const saveJoke = async (joke: Joke) => {
    await supabase.from("jokes").update({ setup: joke.setup, punchline: joke.punchline }).eq("id", joke.id)
    setMessage("Joke saved.")
  }
  const updateJokeText = (id: string, patch: Partial<Joke>) => {
    setJokes(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  const saveFact = async (fact: Fact) => {
    await supabase.from("fun_facts").update({ fact: fact.fact, source: fact.source }).eq("id", fact.id)
    setMessage("Fact saved.")
  }
  const updateFactText = (id: string, patch: Partial<Fact>) => {
    setFacts(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const saveGisStory = async () => {
    if (!gisStory) return
    await supabase.from("gis_stories").update({ title: gisStory.title, content: gisStory.content }).eq("id", gisStory.id)
    setMessage("GIS Story saved.")
  }

  const saveMap = async () => {
    if (!mapItem) return
    await supabase.from("maps_dont_lie").update({ title: mapItem.title, commentary: mapItem.commentary }).eq("id", mapItem.id)
    setMessage("Map saved.")
  }

  const saveFeature = async () => {
    if (!feature) return
    await supabase.from("features").update({
      title: feature.title, type: feature.type, author_name: feature.author_name,
      body_markdown: feature.body_markdown, is_ai_suggested: false,
    }).eq("id", feature.id)
    setMessage("Feature saved.")
    setFeature({ ...feature, is_ai_suggested: false })
  }
  const approveAsIsFeature = async () => {
    if (!feature) return
    await supabase.from("features").update({ approved_as_is: true, status: "approved" }).eq("id", feature.id)
    setMessage("Feature approved as-is.")
    await loadIssueContent()
  }

  // Approve / Discard / Restore buttons shared by most cards.
  const statusActions = (table: string, id: string, status: string) => (
    <>
      <span className="flex-1" />
      {status === "discarded" ? (
        <Btn variant="danger" onClick={() => setItemStatus(table, id, "draft")}>Restore</Btn>
      ) : (
        <Btn variant="danger" onClick={() => setItemStatus(table, id, "discarded")}>Discard</Btn>
      )}
    </>
  )
  const approveBtn = (table: string, id: string, status: string) =>
    status === "draft" ? <Btn variant="approve" onClick={() => setItemStatus(table, id, "approved")}>Approve</Btn> : null

  if (!ready || loadingIssue) return <AdminLoading />

  // ── Section state for the sidebar ──
  const itemCount: Record<SectionName, number> = {
    news: stories.length, gis_story: gisStory ? 1 : 0, maps_dont_lie: mapItem ? 1 : 0, comics: comics.length,
    games: games.length, events: events.length, quote: quote ? 1 : 0, jokes: jokes.length,
    fun_facts: facts.length, features: feature ? 1 : 0,
  }
  const sectionState = (s: SectionName): { tone: "review" | "reviewed" | "skipped" | "empty"; label: string } => {
    const row = getRow(s)
    if (row?.skipped) return { tone: "skipped", label: "Skipped" }
    if (row?.reviewed) return { tone: "reviewed", label: "Reviewed ✓" }
    if (itemCount[s] === 0) return { tone: "empty", label: "Empty" }
    return { tone: "review", label: "To review" }
  }

  const activeRow = getRow(activeTab)
  const statusesFor = (s: SectionName): string[] => ({
    news: stories.map(x => x.status), gis_story: gisStory ? [gisStory.status] : [], maps_dont_lie: mapItem ? [mapItem.status] : [],
    comics: comics.map(x => x.status), games: games.map(x => x.status), events: events.map(x => x.status),
    quote: quote ? [quote.status] : [], jokes: jokes.map(x => x.status), fun_facts: facts.map(x => x.status),
    features: feature ? [feature.status] : [],
  }[s])
  const activeStatuses = statusesFor(activeTab)
  const countsText = activeStatuses.length
    ? `${activeStatuses.length} ${activeStatuses.length === 1 ? "item" : "items"} · ${activeStatuses.filter(s => s === "approved").length} approved · ${activeStatuses.filter(s => s === "discarded").length} discarded`
    : "No items"
  const pct = Math.round((reviewedCount / SECTION_ORDER.length) * 100)
  const published = currentIssue?.status === "published"

  return (
    <div className="min-h-screen">
      <AdminHeader active="review" onLogout={logout} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">

        {!currentIssue && (
          <div className="mt-8 border border-dashed border-[#B9B8B0] bg-card px-6 py-12 text-center">
            <div className="font-display font-bold text-[22px]">No issues yet</div>
            <p className="mt-2 font-sans text-[15px] text-ink-3">Run the weekly pipeline to create the first draft issue.</p>
          </div>
        )}

        {currentIssue && (
          <>
            {/* Title row: issue picker, progress and publish */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 py-5 border-b border-hair">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="font-display font-bold text-[26px] leading-none">Editor&apos;s Desk</h1>
                <select
                  value={currentIssue.id}
                  onChange={e => { const found = issues.find(i => i.id === e.target.value); if (found) setCurrentIssue(found) }}
                  className="w-full sm:w-auto font-sans text-base sm:text-sm px-2.5 py-2.5 sm:py-2 border border-hair-2 bg-card text-ink rounded-none outline-none focus:border-accent max-w-full"
                >
                  {issues.map(i => (
                    <option key={i.id} value={i.id}>
                      Issue #{i.issue_number} · {i.status === "published" ? `published ${formatDate(i.published_at, "dayMonth")}` : i.status}
                    </option>
                  ))}
                </select>
                <span className="font-sans font-medium text-[13px] text-ink-3">
                  {reviewedCount} of {SECTION_ORDER.length} sections ready
                </span>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-[180px] h-1.5 bg-hair" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-1.5 bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <button
                  type="button"
                  onClick={publishIssue}
                  disabled={!allSectionsReviewed || publishing || published}
                  className={`min-h-11 sm:min-h-0 font-sans font-semibold text-xs leading-none tracking-button uppercase text-paper px-[18px] py-[13px] transition-colors ${
                    allSectionsReviewed && !published ? "bg-accent hover:bg-accent-deep cursor-pointer" : "bg-[#B9B8B0] cursor-not-allowed"
                  }`}
                >
                  {published ? "Published" : publishing ? "Publishing…" : "Publish issue"}
                </button>
              </div>
            </div>

            <Notice message={message} />

            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 lg:gap-7 pt-5">
              {/* Section list */}
              <nav className="flex lg:flex-col border-t-2 border-ink overflow-x-auto no-scrollbar lg:self-start">
                {SECTION_ORDER.map(s => {
                  const st = sectionState(s)
                  const active = s === activeTab
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setActiveTab(s)}
                      className={`flex-none flex justify-between items-center gap-2.5 px-3 py-3 border-b border-hair border-l-[3px] text-left font-sans text-[14.5px] text-ink cursor-pointer ${
                        active ? "border-l-accent bg-card font-bold" : "border-l-transparent font-medium hover:bg-card"
                      }`}
                    >
                      <span className="whitespace-nowrap">{SECTION_LABELS[s]}</span>
                      <Chip tone={st.tone}>{st.label}</Chip>
                    </button>
                  )
                })}
                <div className="hidden lg:block px-1 py-3.5 font-sans text-[12.5px] leading-[1.5] text-meta">
                  Every section must be reviewed or skipped before publishing.
                </div>
              </nav>

              {/* Active section */}
              <section>
                <div className="flex flex-wrap justify-between items-end gap-4 pb-3.5 border-b-2 border-ink">
                  <div>
                    <div className="font-sans font-bold text-label leading-none tracking-label uppercase text-accent">Section</div>
                    <h2 className="font-display font-bold text-h1 leading-[1.1] mt-1.5">{SECTION_LABELS[activeTab]}</h2>
                  </div>
                  <div className="font-sans font-medium text-[13px] text-ink-3">{countsText}</div>
                </div>

                {activeRow?.skipped && (
                  <div className="mt-3.5 flex flex-wrap justify-between items-center gap-3 bg-paper-2 border border-hair px-4 py-3">
                    <span className="font-sans text-sm text-ink-3">This section is skipped and won&apos;t appear in the issue.</span>
                    <Btn variant="secondary" onClick={() => reopenSection(activeTab)}>Undo skip</Btn>
                  </div>
                )}

                {itemCount[activeTab] === 0 && (
                  <div className="mt-3.5 border border-dashed border-[#B9B8B0] bg-card px-6 py-12 text-center">
                    <div className="font-display font-bold text-[22px] leading-[1.2]">Nothing for {SECTION_LABELS[activeTab]} this week</div>
                    <p className="mt-2 mb-[18px] mx-auto max-w-[420px] font-sans text-[15px] leading-[1.55] text-ink-3">
                      {activeTab === "comics"
                        ? "No strips uploaded for this issue yet. Upload one from the Comics tab, or skip the section."
                        : "The pipeline found no items. Skip the section and it won't appear in the issue."}
                    </p>
                    {SKIPPABLE.includes(activeTab) && !activeRow?.skipped && (
                      <Btn variant="secondary" onClick={() => skipSection(activeTab)}>Skip this week</Btn>
                    )}
                  </div>
                )}

                {/* ── NEWS ── */}
                {activeTab === "news" && stories.map(story => (
                  <ItemCard key={story.id} status={story.status} lead={story.is_lead} aiDraft={isAiDraft(story.status)}
                    badges={<RegionPill region={story.region} />}
                    meta={[story.source_name, story.topic, story.scraped_at ? `scraped ${formatDate(story.scraped_at, "dayMonth")}` : null].filter(Boolean).join(" · ")}
                    actions={<>
                      {approveBtn("stories", story.id, story.status)}
                      <Btn onClick={() => saveStory(story)}>Save edits</Btn>
                      {!story.is_lead && <Btn onClick={() => setLeadStory(story.id)}>Set as lead</Btn>}
                      {statusActions("stories", story.id, story.status)}
                    </>}>
                    <input aria-label="Title" type="text" value={story.title} onChange={e => updateStoryText(story.id, { title: e.target.value })} className={titleInputCls} />
                    <textarea aria-label="Summary" value={story.summary || ""} onChange={e => updateStoryText(story.id, { summary: e.target.value })} rows={3} className={bodyInputCls} />
                  </ItemCard>
                ))}

                {/* ── GIS STORY ── */}
                {activeTab === "gis_story" && gisStory && (
                  <ItemCard status={gisStory.status} aiDraft={isAiDraft(gisStory.status)}
                    badges={<TypePill kind="story" value={gisStory.story_type} />}
                    actions={<>
                      {approveBtn("gis_stories", gisStory.id, gisStory.status)}
                      <Btn onClick={saveGisStory}>Save edits</Btn>
                      {statusActions("gis_stories", gisStory.id, gisStory.status)}
                    </>}>
                    <input aria-label="Title" type="text" value={gisStory.title} onChange={e => setGisStory({ ...gisStory, title: e.target.value })} className={titleInputCls} />
                    <textarea aria-label="Story" value={gisStory.content} onChange={e => setGisStory({ ...gisStory, content: e.target.value })} rows={14} className={bodyInputCls} />
                  </ItemCard>
                )}

                {/* ── MAPS DON'T LIE ── */}
                {activeTab === "maps_dont_lie" && mapItem && (
                  <ItemCard status={mapItem.status} aiDraft={isAiDraft(mapItem.status)}
                    badges={<TypePill kind="map" value={mapItem.map_type} />}
                    meta={mapItem.image_url ? null : "No image yet. Add one in the Maps tab."}
                    actions={<>
                      {approveBtn("maps_dont_lie", mapItem.id, mapItem.status)}
                      <Btn onClick={saveMap}>Save edits</Btn>
                      {statusActions("maps_dont_lie", mapItem.id, mapItem.status)}
                    </>}>
                    <input aria-label="Title" type="text" value={mapItem.title} onChange={e => setMapItem({ ...mapItem, title: e.target.value })} className={titleInputCls} />
                    {mapItem.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" src={mapItem.image_url} alt={mapItem.title} className="w-full max-h-72 object-contain bg-paper-2 border border-hair" />
                    )}
                    <textarea aria-label="Commentary" value={mapItem.commentary} onChange={e => setMapItem({ ...mapItem, commentary: e.target.value })} rows={6} className={bodyInputCls} />
                  </ItemCard>
                )}

                {/* ── COMICS ── */}
                {activeTab === "comics" && comics.map((strip, i) => (
                  <ItemCard key={strip.id} status={strip.status}
                    meta={`Strip ${i + 1} of ${comics.length} · upload`}
                    actions={<>
                      {approveBtn("comic_strips", strip.id, strip.status)}
                      {statusActions("comic_strips", strip.id, strip.status)}
                    </>}>
                    <div className="font-display font-semibold text-h3">{strip.title}</div>
                    {strip.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" src={strip.image_url} alt={strip.title} className="w-full border border-hair" />
                    )}
                  </ItemCard>
                ))}

                {/* ── GAMES ── */}
                {activeTab === "games" && games.map(game => (
                  <ItemCard key={game.id} status={game.status} aiDraft={isAiDraft(game.status)}
                    meta="Check it on the live preview before approving."
                    actions={<>
                      {approveBtn("games", game.id, game.status)}
                      {statusActions("games", game.id, game.status)}
                    </>}>
                    <div className="font-display font-semibold text-h3 capitalize">{game.game_type.replace(/_/g, " ")}</div>
                  </ItemCard>
                ))}

                {/* ── EVENTS ── */}
                {activeTab === "events" && events.map(ev => (
                  <ItemCard key={ev.id} status={ev.status} aiDraft={isAiDraft(ev.status)}
                    badges={<TypePill kind="event" value={ev.event_type} />}
                    meta={[formatDate(ev.start_date, "short"), ev.location].filter(Boolean).join(" · ")}
                    actions={<>
                      {approveBtn("events", ev.id, ev.status)}
                      <Btn onClick={() => saveEvent(ev)}>Save edits</Btn>
                      {statusActions("events", ev.id, ev.status)}
                    </>}>
                    <input aria-label="Name" type="text" value={ev.name} onChange={e => updateEventText(ev.id, { name: e.target.value })} className={titleInputCls} />
                    <textarea aria-label="Description" value={ev.description || ""} onChange={e => updateEventText(ev.id, { description: e.target.value })} rows={2} className={bodyInputCls} />
                  </ItemCard>
                ))}

                {/* ── QUOTE ── */}
                {activeTab === "quote" && quote && (
                  <ItemCard status={quote.status} aiDraft={isAiDraft(quote.status)}
                    actions={<>
                      {approveBtn("quotes", quote.id, quote.status)}
                      <Btn onClick={saveQuote}>Save edits</Btn>
                    </>}>
                    <textarea aria-label="Quote text" value={quote.quote_text} onChange={e => setQuote({ ...quote, quote_text: e.target.value })} rows={3}
                      className={`${softInputCls} font-serif italic text-lg leading-[1.45] resize-y`} placeholder="Quote text" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input aria-label="Author" type="text" value={quote.quote_author} onChange={e => setQuote({ ...quote, quote_author: e.target.value })} className={`${softInputCls} font-sans text-base sm:text-[15px]`} placeholder="Author" />
                      <input aria-label="Author role" type="text" value={quote.quote_role || ""} onChange={e => setQuote({ ...quote, quote_role: e.target.value })} className={`${softInputCls} font-sans text-base sm:text-[15px]`} placeholder="Author role" />
                    </div>
                  </ItemCard>
                )}

                {/* ── JOKES ── */}
                {activeTab === "jokes" && jokes.map(joke => (
                  <ItemCard key={joke.id} status={joke.status} aiDraft={isAiDraft(joke.status)}
                    meta={joke.topic}
                    actions={<>
                      {approveBtn("jokes", joke.id, joke.status)}
                      <Btn onClick={() => saveJoke(joke)}>Save edits</Btn>
                      {statusActions("jokes", joke.id, joke.status)}
                    </>}>
                    <input aria-label="Setup" type="text" value={joke.setup} onChange={e => updateJokeText(joke.id, { setup: e.target.value })} className={`${softInputCls} font-serif text-[17px]`} placeholder="Setup" />
                    <input aria-label="Punchline" type="text" value={joke.punchline} onChange={e => updateJokeText(joke.id, { punchline: e.target.value })} className={`${softInputCls} font-serif italic text-[17px]`} placeholder="Punchline" />
                  </ItemCard>
                ))}

                {/* ── FUN FACTS ── */}
                {activeTab === "fun_facts" && facts.map(fact => (
                  <ItemCard key={fact.id} status={fact.status} aiDraft={isAiDraft(fact.status)}
                    meta={fact.topic}
                    actions={<>
                      {approveBtn("fun_facts", fact.id, fact.status)}
                      <Btn onClick={() => saveFact(fact)}>Save edits</Btn>
                      {statusActions("fun_facts", fact.id, fact.status)}
                    </>}>
                    <textarea aria-label="Fact" value={fact.fact} onChange={e => updateFactText(fact.id, { fact: e.target.value })} rows={2} className={bodyInputCls} />
                    <input aria-label="Source" type="text" value={fact.source || ""} onChange={e => updateFactText(fact.id, { source: e.target.value })} className={`${softInputCls} font-sans text-base sm:text-sm`} placeholder="Source" />
                  </ItemCard>
                ))}

                {/* ── FEATURES ── */}
                {activeTab === "features" && feature && (
                  <ItemCard status={feature.status} aiDraft={feature.is_ai_suggested}
                    actions={<>
                      {feature.is_ai_suggested && !feature.approved_as_is && (
                        <Btn variant="approve" onClick={approveAsIsFeature}>Approve as-is</Btn>
                      )}
                      {feature.status === "draft" && !feature.is_ai_suggested && (
                        <Btn variant="approve" onClick={() => setItemStatus("features", feature.id, "approved")}>Approve</Btn>
                      )}
                      <Btn onClick={saveFeature}>Save edits</Btn>
                    </>}>
                    <input aria-label="Title" type="text" value={feature.title} onChange={e => setFeature({ ...feature, title: e.target.value })} className={titleInputCls} placeholder="Title" />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select aria-label="Type" value={feature.type} onChange={e => setFeature({ ...feature, type: e.target.value })} className={`${softInputCls} font-sans text-base sm:text-[15px] sm:w-auto`}>
                        {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input aria-label="Author" type="text" value={feature.author_name} onChange={e => setFeature({ ...feature, author_name: e.target.value })} className={`${softInputCls} font-sans text-base sm:text-[15px] flex-1`} placeholder="Author / byline" />
                    </div>
                    <textarea aria-label="Body" value={feature.body_markdown} onChange={e => setFeature({ ...feature, body_markdown: e.target.value })} rows={12} className={bodyInputCls} placeholder="Write in Markdown…" />
                  </ItemCard>
                )}

                {/* Section footer */}
                {!activeRow?.skipped && (
                  <div className="flex flex-wrap justify-between items-center gap-3 mt-5 pt-4 border-t border-hair">
                    {SKIPPABLE.includes(activeTab) && !activeRow?.reviewed ? (
                      <Btn variant="quiet" className="py-3 px-4" onClick={() => skipSection(activeTab)}>Skip this week</Btn>
                    ) : <span />}
                    {activeRow?.reviewed ? (
                      <div className="flex items-center gap-3">
                        <span className="font-sans font-bold text-xs tracking-meta uppercase text-accent">Section reviewed ✓</span>
                        <Btn variant="quiet" onClick={() => reopenSection(activeTab)}>Reopen</Btn>
                      </div>
                    ) : (
                      <BigBtn onClick={() => markReviewed(activeTab)}>Mark section reviewed ✓</BigBtn>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default EditorsDeskPage
