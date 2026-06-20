"use client"
import { useState, useEffect, useCallback } from "react"
import AdminHeader from "@/components/AdminHeader"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type SectionName =
  | "quote" | "news" | "events" | "features" | "gis_story"
  | "maps_dont_lie" | "jokes" | "fun_facts" | "games" | "comics" | "jobs"

interface Issue {
  id: string
  issue_number: number
  headline: string
  editor_note: string | null
  status: string
}

interface ReviewRow {
  id: string
  issue_id: string
  section_name: SectionName
  reviewed: boolean
  skipped: boolean
}

interface Story {
  id: string; title: string; summary: string; source_name: string
  region: string; topic: string; status: string; is_lead: boolean
}
interface JobItem {
  id: string; title: string; company: string; location: string
  description: string; bucket: string; status: string
}
interface EventItem {
  id: string; name: string; description: string; start_date: string
  location: string; status: string
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

const SECTION_LABELS: Record<SectionName, string> = {
  quote: "Weekly Quote",
  news: "News",
  events: "Events",
  features: "Features",
  gis_story: "GIS Story",
  maps_dont_lie: "Maps Don't Lie",
  jokes: "Jokes",
  fun_facts: "Fun Facts",
  games: "Games",
  comics: "Comics",
  jobs: "Jobs",
}

const SECTION_ORDER: SectionName[] = [
  "quote", "news", "events", "features", "gis_story",
  "maps_dont_lie", "jokes", "fun_facts", "games", "comics", "jobs",
]

const FEATURE_TYPES = ["Interview", "Concept Explainer", "Book & Paper Review", "App & Tool Review", "Opinion"]

// ─────────────────────────────────────────
// Small shared UI bits
// ─────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => {
  const styles =
    status === "approved" ? "bg-green-100 text-green-700" :
    status === "discarded" ? "bg-red-100 text-red-700" :
    "bg-amber-100 text-amber-700"
  return <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded ${styles}`}>{status}</span>
}

const SectionReviewBar = ({
  row, onMarkReviewed, onSkip, canSkip,
}: {
  row: ReviewRow | undefined
  onMarkReviewed: () => void
  onSkip: () => void
  canSkip: boolean
}) => {
  if (!row) return null
  if (row.skipped) {
    return (
      <div className="flex items-center justify-between bg-gray-100 border border-gray-300 px-4 py-3 mb-6">
        <span className="text-xs font-sans text-gray-500">This section was deliberately skipped this week.</span>
        <button onClick={onMarkReviewed} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Undo skip</button>
      </div>
    )
  }
  return (
    <div className={`flex items-center justify-between border px-4 py-3 mb-6 ${row.reviewed ? "border-green-300 bg-green-50" : "border-amber-300 bg-amber-50"}`}>
      <span className={`text-xs font-sans font-bold ${row.reviewed ? "text-green-700" : "text-amber-700"}`}>
        {row.reviewed ? "✓ Reviewed" : "Not yet reviewed"}
      </span>
      <div className="flex gap-4">
        {canSkip && !row.reviewed && (
          <button onClick={onSkip} className="text-xs font-sans font-bold text-gray-500 hover:underline">Skip this week</button>
        )}
        {!row.reviewed && (
          <button onClick={onMarkReviewed} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Mark section reviewed</button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

const EditorsDeskPage = () => {
  const { ready, logout } = useAdminAuth()

  const [issues, setIssues] = useState<Issue[]>([])
  const [currentIssue, setCurrentIssue] = useState<Issue | null>(null)
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([])
  const [activeTab, setActiveTab] = useState<SectionName>("quote")
  const [message, setMessage] = useState("")
  const [loadingIssue, setLoadingIssue] = useState(true)
  const [publishing, setPublishing] = useState(false)

  const [stories, setStories] = useState<Story[]>([])
  const [jobs, setJobs] = useState<JobItem[]>([])
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
        .select("id, issue_number, headline, editor_note, status")
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
      { data: jobsData },
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
      supabase.from("jobs").select("*").eq("issue_id", issueId),
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
    setJobs(jobsData || [])
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
    if (currentIssue) loadIssueContent()
  }, [currentIssue, loadIssueContent])

  // ── Review row helpers ──
  const getRow = (section: SectionName) => reviewRows.find(r => r.section_name === section)

  const setSectionFlag = async (section: SectionName, patch: Partial<Pick<ReviewRow, "reviewed" | "skipped">>) => {
    if (!currentIssue) return
    const row = getRow(section)
    if (!row) return
    const { error } = await supabase.from("issue_section_review").update(patch).eq("id", row.id)
    if (error) { setMessage("Error: " + error.message); return }
    setReviewRows(rows => rows.map(r => r.id === row.id ? { ...r, ...patch } : r))
  }

  const markReviewed = (section: SectionName) => setSectionFlag(section, { reviewed: true, skipped: false })
  const skipSection = (section: SectionName) => setSectionFlag(section, { reviewed: true, skipped: true })

  const allSectionsReviewed = SECTION_ORDER.every(s => {
    const row = getRow(s)
    return row?.reviewed
  })
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

  const updateStoryText = async (id: string, patch: Partial<Story>) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }
  const saveStory = async (story: Story) => {
    await supabase.from("stories").update({ title: story.title, summary: story.summary }).eq("id", story.id)
    setMessage("Story saved.")
  }

  const updateJobText = (id: string, patch: Partial<JobItem>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }
  const saveJob = async (job: JobItem) => {
    await supabase.from("jobs").update({ title: job.title, description: job.description }).eq("id", job.id)
    setMessage("Job saved.")
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
  const approveQuote = async () => {
    if (!quote) return
    await setItemStatus("quotes", quote.id, "approved")
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
  const approveGisStory = async () => {
    if (!gisStory) return
    await setItemStatus("gis_stories", gisStory.id, "approved")
  }

  const saveMap = async () => {
    if (!mapItem) return
    await supabase.from("maps_dont_lie").update({ title: mapItem.title, commentary: mapItem.commentary }).eq("id", mapItem.id)
    setMessage("Map saved.")
  }
  const approveMap = async () => {
    if (!mapItem) return
    await setItemStatus("maps_dont_lie", mapItem.id, "approved")
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
  const approveFeature = async () => {
    if (!feature) return
    await setItemStatus("features", feature.id, "approved")
  }

  if (!ready || loadingIssue) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <span className="text-xs font-sans text-gray-400">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-serif">

      <AdminHeader active="review" topLeftLabel="Admin · Editor's Desk" onLogout={logout} />

      {message && (
        <div className={`mb-4 px-4 py-3 text-sm font-sans border ${
          message.startsWith("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {!currentIssue && (
        <p className="text-sm font-sans text-gray-400 italic">No issues found. Run the weekly pipeline first.</p>
      )}

      {currentIssue && (
        <>
          {/* Issue selector + status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <select
                value={currentIssue.id}
                onChange={e => { const found = issues.find(i => i.id === e.target.value); if (found) setCurrentIssue(found) }}
                className="border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white"
              >
                {issues.map(i => (
                  <option key={i.id} value={i.id}>
                    Issue #{i.issue_number} — {i.headline?.slice(0, 40)} ({i.status})
                  </option>
                ))}
              </select>
              <StatusPill status={currentIssue.status} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-sans text-gray-500">{reviewedCount}/{SECTION_ORDER.length} sections reviewed</span>
              <button
                onClick={publishIssue}
                disabled={!allSectionsReviewed || publishing || currentIssue.status === "published"}
                className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-5 py-2.5 hover:bg-[#1a6b3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {currentIssue.status === "published" ? "Published" : publishing ? "Publishing..." : "Publish Issue"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap">
            {SECTION_ORDER.map(section => {
              const row = getRow(section)
              const done = row?.reviewed
              return (
                <button
                  key={section}
                  onClick={() => setActiveTab(section)}
                  className={`flex-shrink-0 text-xs font-sans font-bold tracking-widest uppercase px-3 py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === section ? "border-[#1a6b3c] text-[#1a6b3c]" : "border-transparent text-gray-500 hover:text-[#1a1a1a]"
                  }`}
                >
                  {done && <span className="text-[#1a6b3c]">✓</span>}
                  {SECTION_LABELS[section]}
                </button>
              )
            })}
          </div>

          {/* ── QUOTE ── */}
          {activeTab === "quote" && (
            <div>
              <SectionReviewBar row={getRow("quote")} onMarkReviewed={() => markReviewed("quote")} onSkip={() => skipSection("quote")} canSkip={false} />
              {!quote && <p className="text-sm font-sans text-gray-400 italic">No quote generated yet for this issue.</p>}
              {quote && (
                <div className="border border-gray-200 p-4 flex flex-col gap-3">
                  <StatusPill status={quote.status} />
                  <textarea value={quote.quote_text} onChange={e => setQuote({ ...quote, quote_text: e.target.value })}
                    rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none" placeholder="Quote text" />
                  <input type="text" value={quote.quote_author} onChange={e => setQuote({ ...quote, quote_author: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Author" />
                  <input type="text" value={quote.quote_role} onChange={e => setQuote({ ...quote, quote_role: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Author role" />
                  <div className="flex gap-4">
                    <button onClick={saveQuote} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                    {quote.status === "draft" && <button onClick={approveQuote} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NEWS ── */}
          {activeTab === "news" && (
            <div>
              <SectionReviewBar row={getRow("news")} onMarkReviewed={() => markReviewed("news")} onSkip={() => skipSection("news")} canSkip={false} />
              {stories.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No news stories for this issue.</p>}
              <div className="flex flex-col gap-4">
                {stories.map(story => (
                  <div key={story.id} className={`border p-4 ${story.is_lead ? "border-[#1a6b3c] bg-emerald-50" : "border-gray-200"}`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusPill status={story.status} />
                      <span className="text-xs font-sans text-gray-400">{story.region} · {story.topic} · {story.source_name}</span>
                      {story.is_lead && <span className="text-xs font-sans font-bold text-[#1a6b3c]">★ LEAD STORY</span>}
                    </div>
                    <input type="text" value={story.title} onChange={e => updateStoryText(story.id, { title: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a] mb-2" />
                    <textarea value={story.summary} onChange={e => updateStoryText(story.id, { summary: e.target.value })}
                      rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-2" />
                    <div className="flex items-center gap-4 flex-wrap">
                      <button onClick={() => saveStory(story)} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                      {!story.is_lead && <button onClick={() => setLeadStory(story.id)} className="text-xs font-sans font-bold text-gray-500 hover:underline">Set as lead</button>}
                      {story.status === "draft" && <button onClick={() => setItemStatus("stories", story.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {story.status !== "discarded" && <button onClick={() => setItemStatus("stories", story.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EVENTS ── */}
          {activeTab === "events" && (
            <div>
              <SectionReviewBar row={getRow("events")} onMarkReviewed={() => markReviewed("events")} onSkip={() => skipSection("events")} canSkip={true} />
              {events.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No events for this issue.</p>}
              <div className="flex flex-col gap-4">
                {events.map(ev => (
                  <div key={ev.id} className="border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusPill status={ev.status} />
                      <span className="text-xs font-sans text-gray-400">{ev.start_date} · {ev.location}</span>
                    </div>
                    <input type="text" value={ev.name} onChange={e => updateEventText(ev.id, { name: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a] mb-2" />
                    <textarea value={ev.description} onChange={e => updateEventText(ev.id, { description: e.target.value })}
                      rows={2} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-2" />
                    <div className="flex items-center gap-4">
                      <button onClick={() => saveEvent(ev)} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                      {ev.status === "draft" && <button onClick={() => setItemStatus("events", ev.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {ev.status !== "discarded" && <button onClick={() => setItemStatus("events", ev.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FEATURES ── */}
          {activeTab === "features" && (
            <div>
              <SectionReviewBar row={getRow("features")} onMarkReviewed={() => markReviewed("features")} onSkip={() => skipSection("features")} canSkip={true} />
              {!feature && <p className="text-sm font-sans text-gray-400 italic">No suggested Feature for this issue yet.</p>}
              {feature && (
                <div className="border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={feature.status} />
                    {feature.is_ai_suggested && (
                      <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">AI-suggested draft</span>
                    )}
                  </div>
                  <input type="text" value={feature.title} onChange={e => setFeature({ ...feature, title: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a]" placeholder="Title" />
                  <div className="flex gap-3">
                    <select value={feature.type} onChange={e => setFeature({ ...feature, type: e.target.value })}
                      className="border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
                      {FEATURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input type="text" value={feature.author_name} onChange={e => setFeature({ ...feature, author_name: e.target.value })}
                      className="flex-1 border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Author / byline" />
                  </div>
                  <textarea value={feature.body_markdown} onChange={e => setFeature({ ...feature, body_markdown: e.target.value })}
                    rows={12} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed"
                    placeholder="Write in Markdown..." />
                  <div className="flex items-center gap-4 flex-wrap">
                    <button onClick={saveFeature} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                    {feature.is_ai_suggested && !feature.approved_as_is && (
                      <button onClick={approveAsIsFeature} className="text-xs font-sans font-bold text-amber-600 hover:underline">Approve as-is (unedited AI draft)</button>
                    )}
                    {feature.status === "draft" && !feature.is_ai_suggested && (
                      <button onClick={approveFeature} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GIS STORY ── */}
          {activeTab === "gis_story" && (
            <div>
              <SectionReviewBar row={getRow("gis_story")} onMarkReviewed={() => markReviewed("gis_story")} onSkip={() => skipSection("gis_story")} canSkip={false} />
              {!gisStory && <p className="text-sm font-sans text-gray-400 italic">No GIS Story generated yet.</p>}
              {gisStory && (
                <div className="border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2"><StatusPill status={gisStory.status} /><span className="text-xs font-sans text-gray-400">{gisStory.story_type}</span></div>
                  <input type="text" value={gisStory.title} onChange={e => setGisStory({ ...gisStory, title: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a]" />
                  <textarea value={gisStory.content} onChange={e => setGisStory({ ...gisStory, content: e.target.value })}
                    rows={8} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed" />
                  <div className="flex gap-4">
                    <button onClick={saveGisStory} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                    {gisStory.status === "draft" && <button onClick={approveGisStory} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MAPS DON'T LIE ── */}
          {activeTab === "maps_dont_lie" && (
            <div>
              <SectionReviewBar row={getRow("maps_dont_lie")} onMarkReviewed={() => markReviewed("maps_dont_lie")} onSkip={() => skipSection("maps_dont_lie")} canSkip={false} />
              {!mapItem && <p className="text-sm font-sans text-gray-400 italic">No Maps Don&apos;t Lie entry generated yet.</p>}
              {mapItem && (
                <div className="border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2"><StatusPill status={mapItem.status} /><span className="text-xs font-sans text-gray-400">{mapItem.map_type}</span></div>
                  <input type="text" value={mapItem.title} onChange={e => setMapItem({ ...mapItem, title: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a]" />
                  {mapItem.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mapItem.image_url} alt={mapItem.title} className="w-full max-h-60 object-cover border border-gray-200" />
                  )}
                  <textarea value={mapItem.commentary} onChange={e => setMapItem({ ...mapItem, commentary: e.target.value })}
                    rows={6} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed" />
                  <div className="flex gap-4">
                    <button onClick={saveMap} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                    {mapItem.status === "draft" && <button onClick={approveMap} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── JOKES ── */}
          {activeTab === "jokes" && (
            <div>
              <SectionReviewBar row={getRow("jokes")} onMarkReviewed={() => markReviewed("jokes")} onSkip={() => skipSection("jokes")} canSkip={true} />
              {jokes.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No jokes generated yet.</p>}
              <div className="flex flex-col gap-4">
                {jokes.map(joke => (
                  <div key={joke.id} className="border border-gray-200 p-4">
                    <div className="mb-2"><StatusPill status={joke.status} /></div>
                    <input type="text" value={joke.setup} onChange={e => updateJokeText(joke.id, { setup: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] mb-2" placeholder="Setup" />
                    <input type="text" value={joke.punchline} onChange={e => updateJokeText(joke.id, { punchline: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] mb-2" placeholder="Punchline" />
                    <div className="flex items-center gap-4">
                      <button onClick={() => saveJoke(joke)} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                      {joke.status === "draft" && <button onClick={() => setItemStatus("jokes", joke.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {joke.status !== "discarded" && <button onClick={() => setItemStatus("jokes", joke.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── FUN FACTS ── */}
          {activeTab === "fun_facts" && (
            <div>
              <SectionReviewBar row={getRow("fun_facts")} onMarkReviewed={() => markReviewed("fun_facts")} onSkip={() => skipSection("fun_facts")} canSkip={true} />
              {facts.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No fun facts generated yet.</p>}
              <div className="flex flex-col gap-4">
                {facts.map(fact => (
                  <div key={fact.id} className="border border-gray-200 p-4">
                    <div className="mb-2"><StatusPill status={fact.status} /></div>
                    <textarea value={fact.fact} onChange={e => updateFactText(fact.id, { fact: e.target.value })}
                      rows={2} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-2" />
                    <input type="text" value={fact.source} onChange={e => updateFactText(fact.id, { source: e.target.value })}
                      className="w-full border border-gray-200 px-2 py-1 text-xs font-sans outline-none mb-2" placeholder="Source" />
                    <div className="flex items-center gap-4">
                      <button onClick={() => saveFact(fact)} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                      {fact.status === "draft" && <button onClick={() => setItemStatus("fun_facts", fact.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {fact.status !== "discarded" && <button onClick={() => setItemStatus("fun_facts", fact.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GAMES ── */}
          {activeTab === "games" && (
            <div>
              <SectionReviewBar row={getRow("games")} onMarkReviewed={() => markReviewed("games")} onSkip={() => skipSection("games")} canSkip={false} />
              {games.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No games generated yet.</p>}
              <div className="flex flex-col gap-4">
                {games.map(game => (
                  <div key={game.id} className="border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2"><StatusPill status={game.status} /><span className="text-xs font-sans font-bold text-gray-600 capitalize">{game.game_type.replace("_", " ")}</span></div>
                    <p className="text-xs font-sans text-gray-400 mb-2">Generated content — review on the live preview before approving.</p>
                    <div className="flex items-center gap-4">
                      {game.status === "draft" && <button onClick={() => setItemStatus("games", game.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {game.status !== "discarded" && <button onClick={() => setItemStatus("games", game.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMICS ── */}
          {activeTab === "comics" && (
            <div>
              <SectionReviewBar row={getRow("comics")} onMarkReviewed={() => markReviewed("comics")} onSkip={() => skipSection("comics")} canSkip={true} />
              {comics.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No comic strips uploaded yet for this issue. Upload via the Comics tab.</p>}
              <div className="flex flex-col gap-4">
                {comics.map(strip => (
                  <div key={strip.id} className="border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2"><StatusPill status={strip.status} /><span className="text-sm font-sans font-bold">{strip.title}</span></div>
                    {strip.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={strip.image_url} alt={strip.title} className="w-full max-h-60 object-cover border border-gray-200 mb-2" />
                    )}
                    <div className="flex items-center gap-4">
                      {strip.status === "draft" && <button onClick={() => setItemStatus("comic_strips", strip.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {strip.status !== "discarded" && <button onClick={() => setItemStatus("comic_strips", strip.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── JOBS ── */}
          {activeTab === "jobs" && (
            <div>
              <SectionReviewBar row={getRow("jobs")} onMarkReviewed={() => markReviewed("jobs")} onSkip={() => skipSection("jobs")} canSkip={true} />
              {jobs.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No job listings for this issue.</p>}
              <div className="flex flex-col gap-4">
                {jobs.map(job => (
                  <div key={job.id} className="border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusPill status={job.status} />
                      <span className="text-xs font-sans text-gray-400">{job.company} · {job.location} · {job.bucket}</span>
                    </div>
                    <input type="text" value={job.title} onChange={e => updateJobText(job.id, { title: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a] mb-2" />
                    <textarea value={job.description} onChange={e => updateJobText(job.id, { description: e.target.value })}
                      rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-2" />
                    <div className="flex items-center gap-4">
                      <button onClick={() => saveJob(job)} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Save edits</button>
                      {job.status === "draft" && <button onClick={() => setItemStatus("jobs", job.id, "approved")} className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline">Approve</button>}
                      {job.status !== "discarded" && <button onClick={() => setItemStatus("jobs", job.id, "discarded")} className="text-xs font-sans text-red-400 hover:underline">Discard</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default EditorsDeskPage