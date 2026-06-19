export const revalidate = 0

import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Logo from "@/components/Logo"

const HomePage = async () => {
  const { data: issueData } = await supabase
    .from("issues")
    .select("*")
    .eq("status", "published")
    .order("issue_number", { ascending: false })
    .limit(1)
    .single()

  const issue = issueData

  const [
    { data: storiesData },
    { data: jokeData },
    { data: factData },
    { data: gisStoryData },
    { data: mapData },
    { data: comicsData },
    { data: eventsData },
    { data: jobsData },
    { data: allIssuesData },
    { data: quoteData },
  ] = await Promise.all([
    supabase.from("stories").select("id,title,summary,region,topic,source_name,source_url").not("issue_id", "is", null).order("relevance_score", { ascending: false }).limit(4),
    supabase.from("jokes").select("*").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("fun_facts").select("*").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("gis_stories").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("maps_dont_lie").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("comic_strips").select("*, comic_series(title)").order("created_at", { ascending: false }).limit(3),
    supabase.from("events").select("*").eq("is_active", true).gte("start_date", new Date().toISOString().split("T")[0]).order("start_date", { ascending: true }).limit(3),
    supabase.from("jobs").select("*").eq("is_active", true).order("posted_at", { ascending: false }).limit(3),
    supabase.from("issues").select("id,issue_number,slug,headline,published_at").eq("status", "published").order("issue_number", { ascending: false }).limit(4),
    supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(1).single(),
  ])

  const stories = storiesData || []
  const events = eventsData || []
  const jobs = jobsData || []
  const allIssues = allIssuesData || []
  const comics = comicsData || []
  const issueSlug = issue?.slug || ""

  const regionColors: Record<string, string> = {
    "South Asia": "bg-emerald-100 text-emerald-800",
    "Middle East": "bg-orange-100 text-orange-800",
    "Central Asia": "bg-amber-100 text-amber-800",
    "Global": "bg-gray-100 text-gray-700",
    "North America": "bg-blue-100 text-blue-800",
    "Europe": "bg-purple-100 text-purple-800",
    "Africa": "bg-yellow-100 text-yellow-800",
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 font-serif">

      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">
            {issue ? `Issue #${issue.issue_number}` : ""} · {issue?.published_at
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

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-0 font-sans text-xs tracking-widest uppercase">
        <Link href="/" className="text-[#1a6b3c] font-bold">This week</Link>
        <Link href="/issues" className="text-gray-500 hover:text-[#1a1a1a]">All issues</Link>
        <Link href="/jobs" className="text-gray-500 hover:text-[#1a1a1a]">Jobs</Link>
        <Link href="/about" className="text-gray-500 hover:text-[#1a1a1a]">About</Link>
        <Link href="/subscribe" className="text-gray-500 hover:text-[#1a1a1a]">Subscribe</Link>
      </nav>

      {issue && (
        <div className="grid grid-cols-3 border-b-2 border-[#1a1a1a] mb-0">
          <div className="col-span-2 border-r border-gray-200 pr-8 py-8">
            <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">
              This week's briefing
            </p>
            <h1 className="text-4xl font-bold leading-tight mb-5">{issue.headline}</h1>

            {quoteData && (
              <div className="border-l-4 border-gray-200 pl-4 mb-5">
                <p className="text-sm font-sans italic text-gray-500 leading-relaxed mb-1">
                  "{quoteData.quote_text}"
                </p>
                <p className="text-xs font-sans text-gray-400">
                  — {quoteData.quote_author}{quoteData.quote_role ? `, ${quoteData.quote_role}` : ""}
                </p>
              </div>
            )}

            <p className="text-sm font-sans text-gray-600 leading-relaxed italic mb-6 border-l-4 border-[#1a6b3c] pl-4">
              {issue.editor_note}
            </p>

            <Link
              href={`/issues/${issueSlug}`}
              className="inline-block bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#1a6b3c] transition-colors"
            >
              Read full issue →
            </Link>
          </div>

          <div className="pl-6 py-8 flex flex-col gap-0">
            <p className="text-xs font-sans font-bold text-gray-400 tracking-widest uppercase mb-3">
              In this issue
            </p>
            {[
              { label: "GIS News", desc: `${stories.length > 0 ? "Latest from " + stories[0]?.source_name : "Curated stories"}`, anchor: "news" },
              { label: "GIS Story", desc: gisStoryData ? (gisStoryData as {title: string}).title.slice(0, 45) + "..." : "Historical & wild stories", anchor: "story" },
              { label: "Maps Don't Lie", desc: mapData ? (mapData as {title: string}).title.slice(0, 40) + "..." : "Misleading maps exposed", anchor: "map" },
              { label: "Comics", desc: `${comics.length} strips this week`, anchor: "comics" },
              { label: "Games", desc: "Satellite Spot · GeoGuesser · Crossword", anchor: "games" },
              { label: "Events", desc: events.length > 0 ? events[0].name.slice(0, 35) + "..." : "Upcoming GIS events", anchor: "events" },
              { label: "Jobs", desc: `${jobs.length} GIS opportunities`, anchor: "jobs" },
            ].map((item, i) => (
              <Link
                key={item.label}
                href={`/issues/${issueSlug}#${item.anchor}`}
                className={`flex items-start gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 transition-colors ${i < 6 ? "border-b border-gray-100" : ""}`}
              >
                <span className="text-xs font-sans font-bold text-[#1a6b3c] w-24 flex-shrink-0 mt-0.5">{item.label}</span>
                <span className="text-xs font-sans text-gray-500 leading-snug">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 border-b border-gray-200 mb-0">
        <div className="col-span-2 border-r border-gray-200 pr-8 py-6">
          <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-4">
            Top stories
          </p>
          <div className="flex flex-col gap-0">
            {stories.map((story, i) => (
              <div key={story.id} className={`py-4 ${i < stories.length - 1 ? "border-b border-gray-100" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded ${regionColors[story.region] || "bg-gray-100 text-gray-700"}`}>
                    {story.region}
                  </span>
                  <span className="text-xs font-sans text-gray-400">{story.topic}</span>
                </div>
                <h3 className={`font-bold leading-snug mb-1 ${i === 0 ? "text-base" : "text-sm"}`}>{story.title}</h3>
                {i === 0 && <p className="text-xs font-sans text-gray-500 leading-relaxed mb-1">{story.summary}</p>}
                <a href={story.source_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">
                  {story.source_name} →
                </a>
              </div>
            ))}
            <div className="pt-3">
              <Link href={`/issues/${issueSlug}#news`}
                className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
                All stories in this issue →
              </Link>
            </div>
          </div>
        </div>

        <div className="pl-6 py-6 flex flex-col gap-6">
          {jokeData && (
            <div>
              <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">GIS Joke</p>
              <p className="text-sm font-bold mb-1 leading-snug">{jokeData.setup}</p>
              <p className="text-sm font-sans text-gray-500 italic">{jokeData.punchline}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4" />

          {factData && (
            <div>
              <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">Did You Know?</p>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">{factData.fact}</p>
              <span className="text-xs font-sans text-gray-400 mt-1 block">— {factData.source}</span>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4" />

          {events.length > 0 && (
            <div>
              <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">Next event</p>
              <div>
                <p className="text-xs font-bold leading-snug mb-0.5">{events[0].name}</p>
                <p className="text-xs font-sans text-gray-400">
                  {new Date(events[0].start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {events[0].location && events[0].location !== "Online" ? ` · ${events[0].location}` : ""}
                  {events[0].is_online ? " · Online" : ""}
                </p>
                {events[0].is_free && <span className="text-xs font-sans text-green-600 font-bold">Free</span>}
              </div>
              <Link href={`/issues/${issueSlug}#events`}
                className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c] mt-2 block">
                {events.length} upcoming events →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-gray-200 mb-0">

        {gisStoryData && (
          <div className="border-r border-gray-200 pr-6 py-6">
            <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">GIS Story</p>
            <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded mb-2 inline-block ${
              (gisStoryData as {story_type: string}).story_type === "history" ? "bg-amber-100 text-amber-700" :
              (gisStoryData as {story_type: string}).story_type === "wild" ? "bg-red-100 text-red-700" :
              "bg-purple-100 text-purple-700"
            }`}>
              {(gisStoryData as {story_type: string}).story_type}
            </span>
            <h3 className="text-sm font-bold leading-snug mb-2 mt-1">{(gisStoryData as {title: string}).title}</h3>
            <p className="text-xs font-sans text-gray-500 leading-relaxed line-clamp-4">
              {(gisStoryData as {content: string}).content}
            </p>
            <Link href={`/issues/${issueSlug}#story`}
              className="text-xs font-sans text-[#1a6b3c] hover:underline mt-2 block">
              Read story →
            </Link>
          </div>
        )}

        {mapData && (
          <div className="border-r border-gray-200 px-6 py-6">
            <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">Maps Don't Lie</p>
            {(mapData as {image_url: string | null}).image_url ? (
              <img src={(mapData as {image_url: string}).image_url} alt={(mapData as {title: string}).title}
                className="w-full h-28 object-cover border border-gray-200 mb-2" />
            ) : (
              <div className="w-full h-28 bg-gray-100 border border-dashed border-gray-200 mb-2 flex items-center justify-center">
                <span className="text-xs font-sans text-gray-400">Map image pending</span>
              </div>
            )}
            <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 mb-2 inline-block">
              {(mapData as {map_type: string}).map_type}
            </span>
            <h3 className="text-sm font-bold leading-snug mb-1">{(mapData as {title: string}).title}</h3>
            <p className="text-xs font-sans text-gray-500 leading-relaxed line-clamp-3">
              {(mapData as {commentary: string}).commentary}
            </p>
            <Link href={`/issues/${issueSlug}#map`}
              className="text-xs font-sans text-[#1a6b3c] hover:underline mt-2 block">
              Read commentary →
            </Link>
          </div>
        )}

        <div className="pl-6 py-6">
          <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">Comics</p>
          <div className="flex flex-col gap-3 mb-3">
            {comics.map((comic: {id: string, title: string, image_url: string | null, comic_series: {title: string} | null}) => (
              <div key={comic.id} className="flex gap-2 items-start">
                {comic.image_url ? (
                  <img src={comic.image_url} alt={comic.title}
                    className="w-14 h-10 object-cover border border-gray-200 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-10 bg-gray-100 border border-gray-200 flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs text-gray-400">{comic.comic_series?.title}</p>
                  <p className="text-xs font-bold leading-snug">{comic.title}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/issues/${issueSlug}#comics`}
            className="text-xs font-sans text-[#1a6b3c] hover:underline">
            All 5 strips →
          </Link>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2">GIS Jobs</p>
            {jobs.slice(0, 2).map(job => (
              <div key={job.id} className="mb-2">
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold hover:text-[#1a6b3c] leading-snug block">
                  {job.title.slice(0, 45)}{job.title.length > 45 ? "..." : ""}
                </a>
                <span className={`text-xs font-sans px-1.5 py-0.5 rounded font-bold ${
                  job.bucket === "pakistan" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {job.bucket === "pakistan" ? "Pakistan" : "International"}
                </span>
              </div>
            ))}
            <Link href="/jobs" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">
              All jobs →
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 py-6">
        <p className="text-xs font-sans font-bold text-gray-400 tracking-widest uppercase mb-3">Past issues</p>
        <div className="flex flex-col gap-0">
          {allIssues.map((i, idx) => (
            <div key={i.id} className={`flex items-center justify-between py-2.5 ${idx < allIssues.length - 1 ? "border-b border-gray-100" : ""}`}>
              <div className="flex items-center gap-4">
                <span className="text-xs font-sans text-gray-400 w-16 flex-shrink-0">Issue #{i.issue_number}</span>
                <span className="text-sm font-bold leading-snug">{i.headline}</span>
              </div>
              <Link href={`/issues/${i.slug}`}
                className="text-xs font-sans text-[#1a6b3c] hover:underline flex-shrink-0 ml-4">
                Read
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="py-8 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Free. Every Monday.</h2>
            <p className="text-sm font-sans text-gray-600 leading-relaxed">
              GIS news, stories, games, comics, maps, jobs and events —
              curated for the global geospatial community, with a focus on
              South Asia, the Middle East, and Central Asia.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="your@email.com"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a6b3c]" />
            <button className="w-full bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-3 hover:bg-[#1a6b3c] transition-colors">
              Subscribe free
            </button>
            <p className="text-xs font-sans text-gray-400 text-center">No spam. No ads. Unsubscribe any time.</p>
          </div>
        </div>
      </div>

      <footer className="pt-4 flex justify-between items-center">
        <span className="text-xs font-sans text-gray-400">2026 GeoBriefing · Covering the whole map</span>
        <div className="flex gap-4">
          <Link href="/about" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">About</Link>
          <Link href="/subscribe" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">Subscribe</Link>
        </div>
      </footer>

    </div>
  )
}

export default HomePage
