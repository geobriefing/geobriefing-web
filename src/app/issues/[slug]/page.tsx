export const revalidate = 0

import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Logo from "@/components/Logo"
import { notFound } from "next/navigation"
import SatelliteSpot from "@/components/games/SatelliteSpot"
import GeoGuesser from "@/components/games/GeoGuesser"
import GISCrossword from "@/components/games/GISCrossword"

const regionColors: Record<string, string> = {
  "South Asia": "bg-emerald-100 text-emerald-800",
  "Middle East": "bg-orange-100 text-orange-800",
  "Central Asia": "bg-amber-100 text-amber-800",
  "Global": "bg-gray-100 text-gray-700",
  "North America": "bg-blue-100 text-blue-800",
  "Europe": "bg-purple-100 text-purple-800",
  "Africa": "bg-yellow-100 text-yellow-800",
  "Oceania": "bg-teal-100 text-teal-800",
  "South America": "bg-pink-100 text-pink-800",
  "Asia": "bg-cyan-100 text-cyan-800",
}

const Divider = () => <div className="border-t-2 border-[#1a1a1a] my-10" />

const SectionLabel = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <div id={id} className="flex items-center gap-3 mb-6">
    <span className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] whitespace-nowrap">
      {children}
    </span>
    <div className="flex-1 h-px bg-gray-300" />
  </div>
)

interface Story {
  id: string
  title: string
  summary: string
  region: string
  topic: string
  source_name: string
  source_url: string
  relevance_score: number
}

interface Joke {
  id: string
  setup: string
  punchline: string
  topic: string
}

interface Fact {
  id: string
  fact: string
  source: string
  topic: string
}

interface GISStory {
  id: string
  title: string
  content: string
  story_type: string
  status: string
}

interface MapDontLie {
  id: string
  title: string
  commentary: string
  map_type: string
  image_url: string | null
  source_url: string | null
}

interface Comic {
  id: string
  title: string
  image_url: string | null
  comic_series: { title: string; slug: string } | null
}

interface Event {
  id: string
  name: string
  organizer: string
  location: string
  start_date: string
  end_date: string | null
  event_type: string
  is_free: boolean
  is_online: boolean
  url: string
}

interface Job {
  id: string
  title: string
  bucket: string
  job_type: string
  source: string
  apply_url: string
}

interface Game {
  id: string
  game_type: string
  data: Record<string, unknown>
}

interface Quote {
  id: string
  quote_text: string
  quote_author: string
  quote_role: string | null
}

const IssuePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params

  const { data: issueData } = await supabase
    .from("issues")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!issueData) notFound()
  const issue = issueData

  const [
    { data: storiesData },
    { data: jokesData },
    { data: factsData },
    { data: gisStoryData },
    { data: mapData },
    { data: comicsData },
    { data: eventsData },
    { data: jobsData },
    { data: gamesData },
    { data: quoteData },
  ] = await Promise.all([
    supabase.from("stories").select("*").eq("issue_id", issue.id).order("relevance_score", { ascending: false }),
    supabase.from("jokes").select("*").eq("issue_id", issue.id),
    supabase.from("fun_facts").select("*").eq("issue_id", issue.id),
    supabase.from("gis_stories").select("*").eq("issue_id", issue.id).limit(1).single(),
    supabase.from("maps_dont_lie").select("*").eq("issue_id", issue.id).eq("status", "published").limit(1).single(),
    supabase.from("comic_strips").select("*, comic_series(title, slug)").eq("issue_id", issue.id),
    supabase.from("events").select("*").eq("is_active", true).gte("start_date", new Date().toISOString().split("T")[0]).order("start_date", { ascending: true }).limit(8),
    supabase.from("jobs").select("*").eq("is_active", true).order("posted_at", { ascending: false }).limit(8),
    supabase.from("games").select("*").eq("issue_id", issue.id),
    supabase.from("quotes").select("*").eq("issue_id", issue.id).limit(1).single(),
  ])

  const stories = (storiesData || []) as Story[]
  const jokes = (jokesData || []) as Joke[]
  const facts = (factsData || []) as Fact[]
  const comics = (comicsData || []) as Comic[]
  const events = (eventsData || []) as Event[]
  const jobs = (jobsData || []) as Job[]
  const games = (gamesData || []) as Game[]
  const quote = quoteData as Quote | null

  const satelliteGame = games.find(g => g.game_type === "satellite_spot")
  const crosswordGame = games.find(g => g.game_type === "crossword")
  const geoguesserGame = games.find(g => g.game_type === "geoguesser")

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 font-serif">

      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">
            Issue #{issue.issue_number} · {issue.published_at
              ? new Date(issue.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
              : ""}
          </span>
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">geobriefing.com</span>
        </div>
        <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Logo size="lg" />
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-sans text-gray-500">South Asia · Middle East · Central Asia · Global</span>
          <span className="text-xs font-sans text-gray-500">Free weekly · GIS intelligence</span>
        </div>
      </header>

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase">
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">This week</Link>
        <Link href="/issues" className="text-gray-500 hover:text-[#1a1a1a]">All issues</Link>
        <Link href="/jobs" className="text-gray-500 hover:text-[#1a1a1a]">Jobs</Link>
        <Link href="/about" className="text-gray-500 hover:text-[#1a1a1a]">About</Link>
        <Link href="/subscribe" className="text-gray-500 hover:text-[#1a1a1a]">Subscribe</Link>
      </nav>

      <div className="mb-8">
        <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">
          Issue #{issue.issue_number} · Weekly briefing
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-5">{issue.headline}</h1>

        {quote && (
          <div className="border-l-4 border-gray-300 pl-5 my-6">
            <p className="text-base font-sans italic text-gray-600 leading-relaxed mb-2">
              &quot;{quote.quote_text}&quot;
            </p>
            <p className="text-xs font-sans font-bold text-gray-500">
              — {quote.quote_author}
              {quote.quote_role && <span className="font-normal">, {quote.quote_role}</span>}
            </p>
          </div>
        )}

        <div className="border-l-4 border-[#1a6b3c] pl-5 py-3 bg-emerald-50 pr-4">
          <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">Editor</p>
          <p className="text-sm font-sans text-gray-700 leading-relaxed italic">{issue.editor_note}</p>
        </div>
      </div>

      <Divider />

      <SectionLabel id="news">GIS News Digest</SectionLabel>

      <div className="columns-2 gap-8 mb-4" style={{ columnRule: "1px solid #e5e7eb" }}>
        {stories.map((story, i) => (
          <div key={story.id} className="break-inside-avoid mb-6 pb-6 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded ${regionColors[story.region] || "bg-gray-100 text-gray-700"}`}>
                {story.region}
              </span>
              <span className="text-xs font-sans text-gray-400 uppercase tracking-wide">{story.topic}</span>
            </div>
            <h2 className={`font-bold leading-snug mb-2 ${i < 2 ? "text-base" : "text-sm"}`}>{story.title}</h2>
            <p className="text-xs font-sans text-gray-600 leading-relaxed mb-2">{story.summary}</p>
            <a href={story.source_url} target="_blank" rel="noopener noreferrer"
              className="text-xs font-sans text-[#1a6b3c] hover:underline">
              {story.source_name} →
            </a>

            {i === 3 && jokes[0] && (
              <div className="border-l-4 border-[#1a6b3c] bg-[#f0f7f3] px-5 py-4 mt-6 break-inside-avoid">
                <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">GIS Joke</p>
                <p className="text-sm font-bold mb-1 leading-snug">{jokes[0].setup}</p>
                <p className="text-sm font-sans text-gray-600 italic">{jokes[0].punchline}</p>
              </div>
            )}

            {i === 7 && facts[0] && (
              <div className="border border-gray-300 bg-gray-50 px-5 py-4 mt-6 break-inside-avoid">
                <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">Did You Know?</p>
                <p className="text-sm font-sans text-gray-700 leading-relaxed">{facts[0].fact}</p>
                <span className="text-xs font-sans text-gray-400 mt-1 block">— {facts[0].source}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Divider />

      {gisStoryData && (
        <>
          <SectionLabel id="story">GIS Story</SectionLabel>
          <div className="columns-2 gap-8 mb-8" style={{ columnRule: "1px solid #e5e7eb" }}>
            <div className="break-inside-avoid">
              <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded mb-3 inline-block ${
                (gisStoryData as GISStory).story_type === "history" ? "bg-amber-100 text-amber-700" :
                (gisStoryData as GISStory).story_type === "wild" ? "bg-red-100 text-red-700" :
                "bg-purple-100 text-purple-700"
              }`}>
                {(gisStoryData as GISStory).story_type}
              </span>
              <h2 className="text-2xl font-bold leading-snug mb-4 mt-2">{(gisStoryData as GISStory).title}</h2>
              <p className="text-sm font-sans text-gray-700 leading-relaxed">{(gisStoryData as GISStory).content}</p>
            </div>
            <div className="break-inside-avoid flex flex-col gap-4">
              {facts[1] && (
                <div className="border border-gray-300 bg-gray-50 p-4">
                  <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">Fun Fact</p>
                  <p className="text-sm font-sans text-gray-700 leading-relaxed mb-1">{facts[1].fact}</p>
                  <span className="text-xs font-sans text-gray-400">— {facts[1].source}</span>
                </div>
              )}
              {facts[2] && (
                <div className="border-l-4 border-gray-300 pl-4">
                  <p className="text-xs font-sans font-bold text-gray-400 tracking-widest uppercase mb-2">Also</p>
                  <p className="text-sm font-sans text-gray-700 leading-relaxed mb-1">{facts[2].fact}</p>
                  <span className="text-xs font-sans text-gray-400">— {facts[2].source}</span>
                </div>
              )}
              {jokes[1] && (
                <div className="border-l-4 border-[#1a6b3c] bg-[#f0f7f3] px-4 py-3">
                  <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-1">Joke</p>
                  <p className="text-sm font-bold mb-1">{jokes[1].setup}</p>
                  <p className="text-sm font-sans text-gray-600 italic">{jokes[1].punchline}</p>
                </div>
              )}
              {jokes[2] && (
                <div className="border-l-4 border-[#1a6b3c] bg-[#f0f7f3] px-4 py-3">
                  <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-1">Joke</p>
                  <p className="text-sm font-bold mb-1">{jokes[2].setup}</p>
                  <p className="text-sm font-sans text-gray-600 italic">{jokes[2].punchline}</p>
                </div>
              )}
            </div>
          </div>
          <Divider />
        </>
      )}

      {mapData && (
        <>
          <SectionLabel id="map">Maps Don&apos;t Lie</SectionLabel>
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              {(mapData as MapDontLie).image_url ? (
                <img src={(mapData as MapDontLie).image_url!} alt={(mapData as MapDontLie).title}
                  className="w-full border border-gray-200" />
              ) : (
                <div className="w-full h-56 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
                  <span className="text-xs font-sans text-gray-400">Map image pending</span>
                </div>
              )}
              {(mapData as MapDontLie).source_url && (
                <a href={(mapData as MapDontLie).source_url!} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c] mt-1 block">
                  Source →
                </a>
              )}
            </div>
            <div>
              <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded mb-3 inline-block ${
                (mapData as MapDontLie).map_type === "misleading" ? "bg-red-100 text-red-700" :
                (mapData as MapDontLie).map_type === "surprising" ? "bg-blue-100 text-blue-700" :
                (mapData as MapDontLie).map_type === "manipulative" ? "bg-orange-100 text-orange-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {(mapData as MapDontLie).map_type}
              </span>
              <h2 className="text-xl font-bold leading-snug mb-3 mt-2">{(mapData as MapDontLie).title}</h2>
              <p className="text-sm font-sans text-gray-700 leading-relaxed">{(mapData as MapDontLie).commentary}</p>
            </div>
          </div>
          <Divider />
        </>
      )}

      {comics.length > 0 && (
        <>
          <SectionLabel id="comics">Comic Strips</SectionLabel>
          <div className="grid grid-cols-3 gap-5 mb-4">
            {comics.map((comic) => (
              <div key={comic.id}>
                <p className="text-xs font-sans text-gray-400 uppercase tracking-widest mb-1">
                  {comic.comic_series?.title}
                </p>
                <p className="text-xs font-bold mb-2">{comic.title}</p>
                {comic.image_url ? (
                  <img src={comic.image_url} alt={comic.title}
                    className="w-full border border-gray-200" />
                ) : (
                  <div className="w-full h-28 bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-xs font-sans text-gray-300">Image coming soon</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Divider />
        </>
      )}

      {(satelliteGame || crosswordGame || geoguesserGame) && (
        <>
          <SectionLabel id="games">This Week&apos;s Games</SectionLabel>

          {satelliteGame && (
            <div className="mb-10">
              <h3 className="text-base font-bold mb-1">Satellite Spot</h3>
              <p className="text-xs font-sans text-gray-500 mb-4">Where on Earth is this?</p>
              <SatelliteSpot data={satelliteGame.data as unknown as Parameters<typeof SatelliteSpot>[0]["data"]} />
            </div>
          )}

          {geoguesserGame && (
            <div className="mb-10">
              <h3 className="text-base font-bold mb-1">GeoGuesser</h3>
              <p className="text-xs font-sans text-gray-500 mb-4">Drop a pin to guess this location.</p>
              <GeoGuesser data={geoguesserGame.data as unknown as Parameters<typeof GeoGuesser>[0]["data"]} />
            </div>
          )}

          {crosswordGame && (
            <div className="mb-10">
              <h3 className="text-base font-bold mb-1">
                GIS Crossword — {(crosswordGame.data as {title?: string}).title || "This Week"}
              </h3>
              <p className="text-xs font-sans text-gray-500 mb-4">Fill in the grid using GIS terminology.</p>
              <GISCrossword data={crosswordGame.data as unknown as Parameters<typeof GISCrossword>[0]["data"]} />
            </div>
          )}

          <Divider />
        </>
      )}

      {events.length > 0 && (
        <>
          <SectionLabel id="events">Upcoming GIS Events</SectionLabel>
          <div className="mb-8">
            {events.map((event, i) => (
              <div key={event.id} className={`flex items-start gap-4 py-3 ${i < events.length - 1 ? "border-b border-gray-100" : ""}`}>
                <div className="w-14 text-center flex-shrink-0 border-r border-gray-200 pr-4">
                  <div className="text-xs font-sans font-bold text-[#1a6b3c] uppercase">
                    {new Date(event.start_date).toLocaleDateString("en-GB", { month: "short" })}
                  </div>
                  <div className="text-2xl font-bold leading-tight">
                    {new Date(event.start_date).getDate()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-bold hover:text-[#1a6b3c]">
                      {event.name}
                    </a>
                    {event.is_free && <span className="text-xs font-sans text-green-600 font-bold">Free</span>}
                    {event.is_online && <span className="text-xs font-sans text-gray-400">Online</span>}
                  </div>
                  <p className="text-xs font-sans text-gray-500">
                    {event.organizer}
                    {event.location && event.location !== "Online" && ` · ${event.location}`}
                    {event.end_date && event.end_date !== event.start_date && (
                      <span> · until {new Date(event.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    )}
                  </p>
                </div>
                <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                  event.event_type === "conference" ? "bg-blue-100 text-blue-700" :
                  event.event_type === "webinar" ? "bg-purple-100 text-purple-700" :
                  event.event_type === "hackathon" ? "bg-red-100 text-red-700" :
                  event.event_type === "workshop" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {event.event_type}
                </span>
              </div>
            ))}
          </div>
          <Divider />
        </>
      )}

      {jobs.length > 0 && (
        <>
          <SectionLabel id="jobs">GIS Jobs</SectionLabel>
          <div className="grid grid-cols-2 gap-x-8 mb-4">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-start justify-between gap-2 py-3 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-sans font-bold px-1.5 py-0.5 rounded ${
                      job.bucket === "pakistan" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {job.bucket === "pakistan" ? "PK" : "Intl"}
                    </span>
                    <span className="text-xs font-sans text-gray-400">{job.job_type}</span>
                  </div>
                  <p className="text-xs font-bold leading-snug">
                    {job.title.slice(0, 55)}{job.title.length > 55 ? "..." : ""}
                  </p>
                  <span className="text-xs font-sans text-gray-400">{job.source}</span>
                </div>
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-sans font-bold text-[#1a6b3c] hover:underline flex-shrink-0 mt-1">
                  Apply
                </a>
              </div>
            ))}
          </div>
          <Link href="/jobs"
            className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
            All GIS jobs →
          </Link>
          <Divider />
        </>
      )}

      <div className="border border-[#1a6b3c] p-6 mb-8">
        <h3 className="text-lg font-bold mb-1">Enjoyed this issue?</h3>
        <p className="text-sm font-sans text-gray-600 mb-4">
          Subscribe to get Issue #{issue.issue_number + 1} in your inbox next Monday.
        </p>
        <div className="flex gap-2">
          <input type="email" placeholder="your@email.com"
            className="flex-1 border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a6b3c]" />
          <button className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-4 py-2 hover:bg-[#1a6b3c] transition-colors">
            Subscribe
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center border-t-2 border-[#1a1a1a] pt-4">
        <div className="flex gap-4">
          <Link href="/issues" className="text-xs font-sans text-[#1a6b3c] hover:underline">All issues</Link>
          <Link href="/about" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">About</Link>
        </div>
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">Latest issue</Link>
      </div>

    </div>
  )
}

export default IssuePage
