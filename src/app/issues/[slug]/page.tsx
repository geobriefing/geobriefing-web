export const revalidate = 0

import Link from "next/link"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getSettings } from "@/lib/settings"
import { dateParts, formatDate, paragraphs, readTime } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import SubscribeForm from "@/components/SubscribeForm"
import ShareLinks from "@/components/ShareLinks"
import { RegionPill, TypePill } from "@/components/Pills"
import {
  DateBlock, EditorNote, FactBox, ImagePlaceholder, IssueSection, JokeCallout, Label, QuoteCallout,
} from "@/components/Editorial"
import SatelliteSpot from "@/components/games/SatelliteSpot"
import GeoGuesser from "@/components/games/GeoGuesser"
import GISCrossword from "@/components/games/GISCrossword"

interface Story {
  id: string; title: string; summary: string | null; region: string; topic: string | null
  source_name: string | null; source_url: string; is_lead: boolean
}
interface Joke { id: string; setup: string; punchline: string }
interface Fact { id: string; fact: string; source: string | null }
interface GISStory { id: string; title: string; content: string; story_type: string | null }
interface MapDontLie { id: string; title: string; commentary: string; map_type: string; image_url: string | null; source_url: string | null }
interface Comic { id: string; title: string; image_url: string | null; comic_series: { title: string } | null }
interface Event {
  id: string; name: string; organizer: string | null; location: string | null; start_date: string
  end_date: string | null; event_type: string | null; is_free: boolean; is_online: boolean; url: string
}
interface Game { id: string; game_type: string; data: Record<string, unknown> }
interface Quote { quote_text: string; quote_author: string; quote_role: string | null }

const IssuePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params

  const { data: issue } = await supabase
    .from("issues").select("*").eq("slug", slug).eq("status", "published").maybeSingle()
  if (!issue) notFound()

  const today = new Date().toISOString().split("T")[0]
  const [
    { data: storiesData }, { data: jokesData }, { data: factsData }, { data: gisStoryData }, { data: mapData },
    { data: comicsData }, { data: eventsData }, { data: gamesData }, { data: quoteData }, settings,
  ] = await Promise.all([
    supabase.from("stories").select("*").eq("issue_id", issue.id)
      .order("is_lead", { ascending: false }).order("relevance_score", { ascending: false }),
    supabase.from("jokes").select("*").eq("issue_id", issue.id),
    supabase.from("fun_facts").select("*").eq("issue_id", issue.id),
    supabase.from("gis_stories").select("*").eq("issue_id", issue.id).limit(1).maybeSingle(),
    supabase.from("maps_dont_lie").select("*").eq("issue_id", issue.id).limit(1).maybeSingle(),
    supabase.from("comic_strips").select("*, comic_series(title)").eq("issue_id", issue.id),
    supabase.from("events").select("*").eq("is_active", true).gte("start_date", today).order("start_date", { ascending: true }).limit(8),
    supabase.from("games").select("*").eq("issue_id", issue.id),
    supabase.from("quotes").select("*").eq("issue_id", issue.id).limit(1).maybeSingle(),
    getSettings(),
  ])

  const stories = (storiesData || []) as Story[]
  const jokes = (jokesData || []) as Joke[]
  const facts = (factsData || []) as Fact[]
  const gisStory = gisStoryData as GISStory | null
  const mapItem = mapData as MapDontLie | null
  const comics = (comicsData || []) as Comic[]
  const events = (eventsData || []) as Event[]
  const games = (gamesData || []) as Game[]
  const quote = quoteData as Quote | null

  const satelliteGame = games.find(g => g.game_type === "satellite_spot")
  const geoguesserGame = games.find(g => g.game_type === "geoguesser")
  const crosswordGame = games.find(g => g.game_type === "crossword")
  const gameCount = [satelliteGame, geoguesserGame, crosswordGame].filter(Boolean).length

  const minutes = readTime([
    issue.editor_note, ...stories.map(s => s.summary), gisStory?.content, mapItem?.commentary,
    ...jokes.map(j => `${j.setup} ${j.punchline}`), ...facts.map(f => f.fact),
  ])
  const regionCount = new Set(stories.map(s => s.region)).size

  // Until a dedicated must-read pick exists, the lead story is the "If you read one thing" hook.
  const mustRead = stories.find(s => s.is_lead) || null

  // Sections in issue order. Empty sections are left out and the numbering closes up.
  const sections = [
    stories.length > 0 && { id: "news", nav: "News" },
    gisStory && { id: "story", nav: "Story" },
    mapItem && { id: "maps", nav: "Maps" },
    comics.length > 0 && { id: "comics", nav: "Comics" },
    gameCount > 0 && { id: "games", nav: "Games" },
    events.length > 0 && { id: "events", nav: "Events" },
  ].filter(Boolean) as { id: string; nav: string }[]
  const num = (id: string) => sections.findIndex(s => s.id === id) + 1

  // News digest blocks: jokes and facts are dropped in between stories.
  type Block = { kind: "story"; story: Story } | { kind: "joke"; joke: Joke } | { kind: "fact"; fact: Fact }
  const digest: Block[] = []
  stories.forEach((story, i) => {
    digest.push({ kind: "story", story })
    if (i === 1 && jokes[0]) digest.push({ kind: "joke", joke: jokes[0] })
    if (i === 3 && facts[0]) digest.push({ kind: "fact", fact: facts[0] })
  })

  const storyParas = paragraphs(gisStory?.content)
  const mapParas = paragraphs(mapItem?.commentary)

  return (
    <div className="min-h-screen">
      <Masthead active="all-issues" />

      <main className="max-w-[900px] mx-auto px-4 sm:px-6">

        <header className="pt-6 sm:pt-10 pb-7 sm:pb-9">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 font-sans font-medium text-[11px] sm:text-caption tracking-meta uppercase text-meta">
            <span>
              <Link href="/issues" className="text-accent font-semibold hover:text-accent-deep">All issues</Link> / Issue #{issue.issue_number}
            </span>
            <span>{formatDate(issue.published_at, "weekday")} · {minutes} min read</span>
          </div>
          <h1 className="mt-3 sm:mt-[18px] font-display font-bold text-[34px] sm:text-[54px] leading-[1.06] sm:leading-[1.03] tracking-[-0.018em] text-balance max-w-[780px]">
            {issue.headline}
          </h1>

          {(mustRead || gameCount > 0) && (
            <div className={`grid grid-cols-1 ${mustRead && gameCount > 0 ? "sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""} border-t border-ink border-b mt-[18px] sm:mt-[22px]`}>
              {mustRead && (
                <a href={`#story-${mustRead.id}`} className="block py-3 sm:py-3.5 sm:pr-5 text-ink hover:text-accent border-b border-hair sm:border-b-0">
                  <Label>If you read one thing</Label>
                  <div className="font-display font-semibold text-[17px] sm:text-h3 leading-[1.3] mt-1.5 sm:mt-2">{mustRead.title} →</div>
                </a>
              )}
              {gameCount > 0 && (
                <a href="#games" className={`block py-3 sm:py-3.5 text-ink hover:text-accent ${mustRead ? "sm:pl-5 sm:border-l sm:border-hair" : ""}`}>
                  <Label>Games</Label>
                  <div className="font-sans text-[15px] leading-[1.45] text-ink-2 mt-1.5 sm:mt-2">
                    {gameCount === 1 ? "A new puzzle" : `${gameCount} new puzzles`} this week. Play now →
                  </div>
                </a>
              )}
            </div>
          )}

          {quote && <QuoteCallout text={quote.quote_text} author={quote.quote_author} role={quote.quote_role} size="lg" className="my-6 sm:my-7" />}

          {issue.editor_note && (
            <div className={quote ? "" : "mt-6 sm:mt-7"}>
              <EditorNote note={issue.editor_note} name={settings.editorName} photoUrl={settings.editorPhotoUrl} size="lg" />
            </div>
          )}

          {sections.length > 1 && (
            <nav className="flex sm:flex-wrap gap-x-5 gap-y-2 mt-5 sm:mt-7 sm:py-0 border-y border-hair sm:border-0 overflow-x-auto no-scrollbar whitespace-nowrap font-sans font-semibold text-[11px] sm:text-[11.5px] tracking-meta uppercase">
              <span className="text-meta hidden sm:inline-flex items-center">Jump to</span>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex-none flex items-center min-h-11 sm:min-h-0 text-accent hover:text-accent-deep">{s.nav}</a>
              ))}
            </nav>
          )}
        </header>

        {stories.length > 0 && (
          <IssueSection id="news" n={num("news")} title="GIS News Digest"
            aside={`${stories.length} ${stories.length === 1 ? "story" : "stories"} · ${regionCount} ${regionCount === 1 ? "region" : "regions"}`}>
            <div className="md:columns-2 md:gap-11 md:[column-rule:1px_solid_var(--color-hair)]">
              {digest.map((b, i) => (
                <div key={i} className="break-inside-avoid mb-[18px] md:mb-[26px]">
                  {b.kind === "story" && (
                    <article id={`story-${b.story.id}`} className="scroll-mt-4">
                      <div className="flex flex-wrap gap-2 items-center mb-2 sm:mb-[9px]">
                        <RegionPill region={b.story.region} />
                        {b.story.topic && <span className="font-sans font-medium text-[10.5px] sm:text-[11px] tracking-meta uppercase text-meta">{b.story.topic}</span>}
                      </div>
                      <h3 className="font-display font-semibold text-lg sm:text-xl leading-[1.26] text-pretty">{b.story.title}</h3>
                      {b.story.summary && (
                        <p className="mt-2 font-serif text-digest text-ink-2 text-pretty">{b.story.summary}</p>
                      )}
                      <a href={b.story.source_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-2 font-sans font-semibold text-[11.5px] tracking-[.1em] uppercase text-accent hover:text-accent-deep">
                        {b.story.source_name || "Source"} ↗
                      </a>
                      <div className="h-px bg-hair mt-[18px] md:mt-6" />
                    </article>
                  )}
                  {b.kind === "joke" && <JokeCallout setup={b.joke.setup} punchline={b.joke.punchline} />}
                  {b.kind === "fact" && <FactBox fact={b.fact.fact} source={b.fact.source} />}
                </div>
              ))}
            </div>
          </IssueSection>
        )}

        {gisStory && (
          <IssueSection id="story" n={num("story")} title="GIS Story">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-8 md:gap-11">
              <article>
                {gisStory.story_type && <TypePill kind="story" value={gisStory.story_type} className="mb-3" />}
                <h3 className="font-display font-bold text-[27px] sm:text-[38px] leading-[1.12] sm:leading-[1.1] tracking-[-0.012em] text-balance">{gisStory.title}</h3>
                <div className="font-sans font-medium text-caption tracking-meta uppercase text-meta mt-4 mb-6 pb-4 border-b border-hair">
                  {readTime([gisStory.content])} min read
                </div>
                {storyParas.map((p, i) => (
                  <p key={i} className="font-serif text-[17.5px] sm:text-long leading-[1.65] sm:leading-[1.7] text-ink-2 text-pretty mb-5 last:mb-0">
                    {i === 0 ? (
                      <>
                        <span className="float-left font-display font-bold text-[54px] sm:text-[68px] leading-[0.82] text-ink mt-[5px] sm:mt-1.5 mr-2 sm:mr-2.5">{p[0]}</span>
                        {p.slice(1)}
                      </>
                    ) : p}
                  </p>
                ))}
              </article>
              {(facts[1] || jokes[1] || facts[2] || jokes[2]) && (
                <aside className="md:border-l md:border-hair md:pl-[22px] flex flex-col gap-[26px]">
                  {facts[1] && <FactBox fact={facts[1].fact} source={facts[1].source} />}
                  {jokes[1] && <JokeCallout setup={jokes[1].setup} punchline={jokes[1].punchline} />}
                  {facts[2] && <FactBox fact={facts[2].fact} source={facts[2].source} />}
                  {jokes[2] && <JokeCallout setup={jokes[2].setup} punchline={jokes[2].punchline} />}
                </aside>
              )}
            </div>
          </IssueSection>
        )}

        {mapItem && (
          <IssueSection id="maps" n={num("maps")} title="Maps Don't Lie">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 md:gap-9">
              <figure>
                {mapItem.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={mapItem.image_url} alt={mapItem.title} className="w-full border border-hair" />
                ) : (
                  <ImagePlaceholder label="Map image pending" className="aspect-[4/3]" />
                )}
                {mapItem.source_url && (
                  <figcaption className="font-sans text-[13.5px] leading-[1.45] text-meta mt-2">
                    <a href={mapItem.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Source ↗</a>
                  </figcaption>
                )}
              </figure>
              <div>
                <TypePill kind="map" value={mapItem.map_type} />
                <h3 className="mt-3 font-display font-bold text-[22px] sm:text-[26px] leading-[1.18] text-balance">{mapItem.title}</h3>
                {mapParas.map((p, i) => (
                  <p key={i} className="mt-3 font-serif text-[17px] sm:text-[17.5px] leading-[1.65] text-ink-2 text-pretty">{p}</p>
                ))}
              </div>
            </div>
          </IssueSection>
        )}

        {comics.length > 0 && (
          <IssueSection id="comics" n={num("comics")} title="Comics">
            <div className="flex flex-col gap-7">
              {comics.map((comic, i) => (
                <figure key={comic.id}>
                  {comic.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" src={comic.image_url} alt={comic.title} className="w-full border border-ink" />
                  ) : (
                    <ImagePlaceholder label="Strip coming soon" className="aspect-[3/1] border-ink" />
                  )}
                  <figcaption className="flex justify-between gap-3 mt-2 font-sans text-sm text-ink-3">
                    <span>{comic.title}{comic.comic_series?.title ? ` · ${comic.comic_series.title}` : ""}</span>
                    {comics.length > 1 && <span className="text-meta whitespace-nowrap">Strip {i + 1} of {comics.length}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </IssueSection>
        )}

        {gameCount > 0 && (
          <IssueSection id="games" n={num("games")} title="Games">
            {[
              satelliteGame && (
                <SatelliteSpot key="sat" publishDay={settings.publishDay}
                  data={satelliteGame.data as unknown as Parameters<typeof SatelliteSpot>[0]["data"]} />
              ),
              geoguesserGame && (
                <GeoGuesser key="geo" data={geoguesserGame.data as unknown as Parameters<typeof GeoGuesser>[0]["data"]} />
              ),
              crosswordGame && (
                <GISCrossword key="cw" data={crosswordGame.data as unknown as Parameters<typeof GISCrossword>[0]["data"]} />
              ),
            ].filter(Boolean).map((game, i, all) => (
              <div key={i} className={`${i > 0 ? "pt-8 sm:pt-9" : ""} ${i < all.length - 1 ? "pb-8 sm:pb-9 border-b border-hair" : ""}`}>
                {game}
              </div>
            ))}
          </IssueSection>
        )}

        {events.length > 0 && (
          <IssueSection id="events" n={num("events")} title="Upcoming events">
            {events.map(event => (
              <div key={event.id} className="grid grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[62px_minmax(0,1fr)_auto] gap-x-4 sm:gap-x-5 gap-y-2 items-center py-4 border-b border-hair">
                <DateBlock {...dateParts(event.start_date)} small />
                <div>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className="font-display font-semibold text-[17px] sm:text-h3 leading-[1.3]">{event.name}</span>
                    <TypePill kind="event" value={event.event_type} />
                  </div>
                  <div className="font-sans text-[15px] sm:text-[14.5px] leading-[1.4] text-ink-3 mt-1">
                    {[
                      event.organizer,
                      event.location,
                      event.is_online && event.location !== "Online" ? "Online" : null,
                      event.end_date && event.end_date !== event.start_date ? `until ${formatDate(event.end_date, "dayMonth")}` : null,
                      event.is_free ? "Free" : null,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <a href={event.url} target="_blank" rel="noopener noreferrer"
                  className="col-start-2 sm:col-start-auto font-sans font-semibold text-[11.5px] tracking-meta uppercase text-accent hover:text-accent-deep whitespace-nowrap">
                  Details →
                </a>
              </div>
            ))}
          </IssueSection>
        )}

        <section className="border-2 border-ink p-5 sm:px-9 sm:py-8 mt-4 mb-10 sm:mb-14 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 md:gap-8 items-center">
          <div>
            <div className="font-display font-bold text-2xl sm:text-[30px] leading-[1.1]">Enjoyed this issue?</div>
            <p className="mt-2.5 font-sans text-[15px] sm:text-base leading-[1.55] text-ink-3">
              Get the next one in your inbox on {settings.publishDay} afternoon. It&apos;s free, and you can forward it to
              a colleague who still uses Plate Carrée.
            </p>
          </div>
          <div>
            <SubscribeForm variant="inline" publishDay={settings.publishDay} />
            <ShareLinks title={issue.headline} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default IssuePage
