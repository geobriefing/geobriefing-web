export const revalidate = 0

import Link from "next/link"
import { notFound } from "next/navigation"
import { getIssue, type IssueData, type SectionId, type Story, type Joke, type Fact } from "@/lib/issue"
import { getSettings } from "@/lib/settings"
import { dateParts, formatDate, paragraphs } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import SubscribeForm from "@/components/SubscribeForm"
import ShareLinks from "@/components/ShareLinks"
import Markdown from "@/components/Markdown"
import { RegionPill, TypePill } from "@/components/Pills"
import {
  DateBlock, EditorNote, FactBox, ImagePlaceholder, IssueSection, JokeCallout, Label, QuoteCallout, SectionLabel,
} from "@/components/Editorial"
import SatelliteSpot from "@/components/games/SatelliteSpot"
import GeoGuesser from "@/components/games/GeoGuesser"
import GISCrossword from "@/components/games/GISCrossword"

const LANGS: Record<string, string> = { ur: "Urdu", fa: "Persian", ar: "Arabic", ru: "Russian", en: "English" }

const IssuePage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const [d, settings] = await Promise.all([getIssue(slug), getSettings()])
  if (!d) notFound()

  const { issue, stories, jokes, facts, countryDesk, gisStory, map, comics, games, events, datasets, quote, lastWeek } = d
  const sec = (id: SectionId) => d.sections.find(s => s.id === id)
  const regionCount = new Set(stories.map(s => s.region)).size
  const anyGame = games.satellite || games.geoguesser || games.crossword

  // News digest blocks: jokes and facts are dropped in between stories.
  type Block = { kind: "story"; story: Story } | { kind: "joke"; joke: Joke } | { kind: "fact"; fact: Fact }
  const digest: Block[] = []
  stories.forEach((story, i) => {
    digest.push({ kind: "story", story })
    if (i === 1 && jokes[0]) digest.push({ kind: "joke", joke: jokes[0] })
    if (i === 3 && facts[0]) digest.push({ kind: "fact", fact: facts[0] })
  })

  const storyParas = paragraphs(gisStory?.content)
  const mapParas = paragraphs(map?.commentary)

  return (
    <div className="min-h-screen">
      <Masthead active="all-issues" />

      <main className="max-w-[900px] mx-auto px-4 sm:px-6">

        <header className="pt-6 sm:pt-10 pb-7 sm:pb-9">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 font-sans font-medium text-[11px] sm:text-caption tracking-meta uppercase text-meta">
            <span>
              <Link href="/issues" className="text-accent font-semibold hover:text-accent-deep">All issues</Link> / Issue #{issue.issue_number}
            </span>
            <span>{formatDate(issue.published_at, "weekday")} · {d.readTimeMinutes} min read</span>
          </div>
          <h1 className="mt-3 sm:mt-[18px] font-display font-bold text-[34px] sm:text-[54px] leading-[1.06] sm:leading-[1.03] tracking-[-0.018em] text-balance max-w-[780px]">
            {issue.headline}
          </h1>

          <HooksStrip d={d} />

          {quote && <QuoteCallout text={quote.quote_text} author={quote.quote_author} role={quote.quote_role} sourceUrl={quote.source_url} size="lg" className="my-6 sm:my-7" />}

          {issue.editor_note && (
            <div className={quote ? "" : "mt-6 sm:mt-7"}>
              <EditorNote note={issue.editor_note} name={settings.editorName} photoUrl={settings.editorPhotoUrl} size="lg" />
            </div>
          )}

          {d.sections.length > 1 && (
            <nav className="flex sm:flex-wrap gap-x-5 gap-y-2 mt-5 sm:mt-7 sm:py-0 border-y border-hair sm:border-0 overflow-x-auto no-scrollbar whitespace-nowrap font-sans font-semibold text-[11px] sm:text-[11.5px] tracking-meta uppercase">
              <span className="text-meta hidden sm:inline-flex items-center">Jump to</span>
              {d.sections.map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex-none flex items-center min-h-11 sm:min-h-0 text-accent hover:text-accent-deep">{s.nav}</a>
              ))}
            </nav>
          )}
        </header>

        {sec("news") && (
          <IssueSection id="news" n={sec("news")!.n} title={sec("news")!.title}
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
                      {b.story.summary && <p className="mt-2 font-serif text-digest text-ink-2 text-pretty">{b.story.summary}</p>}
                      <a href={b.story.source_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-2 font-sans font-semibold text-[11.5px] tracking-[.1em] uppercase text-accent hover:text-accent-deep">
                        {b.story.source_name || "Source"} ↗
                      </a>
                      <div className="h-px bg-hair mt-[18px] md:mt-6" />
                    </article>
                  )}
                  {b.kind === "joke" && <JokeCallout setup={b.joke.setup} punchline={b.joke.punchline} />}
                  {b.kind === "fact" && <FactBox fact={b.fact.fact} source={b.fact.source} sourceUrl={b.fact.source_url} />}
                </div>
              ))}
            </div>
          </IssueSection>
        )}

        {sec("country") && countryDesk && (
          <IssueSection id="country" n={sec("country")!.n} title={sec("country")!.title}
            aside={`${countryDesk.desk_number ? `Desk ${String(countryDesk.desk_number).padStart(2, "0")} · ` : ""}a different country each week`}>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-8 md:gap-10">
              <div>
                <RegionPill region={countryDesk.region} />
                <h3 className="mt-3 font-display font-bold text-[34px] sm:text-[46px] leading-none tracking-[-0.015em]">{countryDesk.country}</h3>
                {paragraphs(countryDesk.intro).map((p, i) => (
                  <p key={i} className="mt-4 font-serif text-[17px] sm:text-long leading-[1.65] sm:leading-[1.7] text-ink-2 text-pretty">{p}</p>
                ))}
                {countryDesk.follow.length > 0 && (
                  <div className="mt-6">
                    <SectionLabel className="mb-1.5">Who to follow</SectionLabel>
                    {countryDesk.follow.map(f => (
                      <div key={f.name} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-[11px] border-b border-hair">
                        <span className="font-display font-semibold text-[17px] leading-[1.3]">{f.name}</span>
                        <span className="font-sans text-[15px] sm:text-sm text-ink-3 sm:text-right">{f.why}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <aside className="border-t-2 border-ink self-start">
                {countryDesk.facts.map(f => (
                  <div key={f.key} className="py-3 border-b border-hair">
                    <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta">{f.key}</div>
                    <div className="font-display font-semibold text-[16.5px] leading-[1.35] mt-1">{f.value}</div>
                  </div>
                ))}
                {countryDesk.source_urls.length > 0 && (
                  <details className="mt-3 font-sans text-[13px] leading-[1.5] text-meta">
                    <summary className="cursor-pointer text-accent">
                      Sources ({countryDesk.source_urls.length}{countryDesk.source_languages.length ? `, in ${countryDesk.source_languages.map(l => LANGS[l] || l).join(", ")}` : ""})
                    </summary>
                    <ol className="mt-2 flex flex-col gap-1 list-decimal pl-4 break-all">
                      {countryDesk.source_urls.map(u => (
                        <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{new URL(u).hostname.replace(/^www\./, "")}</a></li>
                      ))}
                    </ol>
                  </details>
                )}
                <div className="font-sans text-[13px] leading-[1.5] text-meta mt-2.5">Know this country well? Reply and help write a future desk.</div>
                {issue.reply_prompt && (
                  <div className="font-sans text-[13px] leading-[1.5] text-ink mt-2.5">
                    <b>Guess next week&apos;s country:</b> {issue.reply_prompt} Reply with your guess.
                  </div>
                )}
              </aside>
            </div>
          </IssueSection>
        )}

        {sec("story") && gisStory && (
          <IssueSection id="story" n={sec("story")!.n} title={sec("story")!.title}>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-8 md:gap-11">
              <article>
                {gisStory.story_type && <TypePill kind="story" value={gisStory.story_type} className="mb-3" />}
                <h3 className="font-display font-bold text-[27px] sm:text-[38px] leading-[1.12] sm:leading-[1.1] tracking-[-0.012em] text-balance">{gisStory.title}</h3>
                <div className="font-sans font-medium text-caption tracking-meta uppercase text-meta mt-4 mb-6 pb-4 border-b border-hair">
                  {Math.max(1, Math.round(gisStory.content.split(/\s+/).length / 230))} min read
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
                {gisStory.source_url && (
                  <div className="mt-5 pt-3 border-t border-hair font-sans text-[13.5px] text-meta">
                    Source: <a href={gisStory.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-deep">
                      {gisStory.source_title ? `Wikipedia, “${gisStory.source_title}”` : "Original source"} ↗</a>
                  </div>
                )}
              </article>
              {(facts[1] || jokes[1] || facts[2] || jokes[2]) && (
                <aside className="md:border-l md:border-hair md:pl-[22px] flex flex-col gap-[26px]">
                  {facts[1] && <FactBox fact={facts[1].fact} source={facts[1].source} sourceUrl={facts[1].source_url} />}
                  {jokes[1] && <JokeCallout setup={jokes[1].setup} punchline={jokes[1].punchline} />}
                  {facts[2] && <FactBox fact={facts[2].fact} source={facts[2].source} sourceUrl={facts[2].source_url} />}
                  {jokes[2] && <JokeCallout setup={jokes[2].setup} punchline={jokes[2].punchline} />}
                </aside>
              )}
            </div>
          </IssueSection>
        )}

        {sec("feature") && d.feature && (
          <IssueSection id="feature" n={sec("feature")!.n} title={sec("feature")!.title}>
            <article className="max-w-[680px]">
              <div className="font-sans font-semibold text-label tracking-label uppercase text-accent">{d.feature.type}</div>
              <h3 className="mt-2.5 font-display font-bold text-[27px] sm:text-[38px] leading-[1.12] sm:leading-[1.1] tracking-[-0.012em] text-balance">{d.feature.title}</h3>
              <div className="font-sans font-medium text-caption tracking-meta uppercase text-meta mt-4 mb-6 pb-4 border-b border-hair">
                By {d.feature.author_name} · {Math.max(1, Math.round(d.feature.body_markdown.split(/\s+/).length / 230))} min read
              </div>
              <Markdown source={d.feature.body_markdown} className="font-serif text-[17.5px] sm:text-long leading-[1.65] sm:leading-[1.7] text-ink-2 text-pretty" />
            </article>
          </IssueSection>
        )}

        {sec("maps") && map && (
          <IssueSection id="maps" n={sec("maps")!.n} title={sec("maps")!.title}>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 md:gap-9">
              <figure>
                {map.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={map.image_url} alt={map.title} className="w-full border border-hair" />
                ) : (
                  <ImagePlaceholder label="Map image pending" className="aspect-[4/3]" />
                )}
                {(map.image_credit || map.source_url) && (
                  <figcaption className="font-sans text-[13.5px] leading-[1.45] text-meta mt-2">
                    {map.image_credit && <span>Map: {map.image_credit}. </span>}
                    {map.source_url && <a href={map.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Source ↗</a>}
                  </figcaption>
                )}
              </figure>
              <div>
                <TypePill kind="map" value={map.map_type} />
                <h3 className="mt-3 font-display font-bold text-[22px] sm:text-[26px] leading-[1.18] text-balance">{map.title}</h3>
                {mapParas.map((p, i) => (
                  <p key={i} className="mt-3 font-serif text-[17px] sm:text-[17.5px] leading-[1.65] text-ink-2 text-pretty">{p}</p>
                ))}
              </div>
            </div>
          </IssueSection>
        )}

        {sec("comics") && (
          <IssueSection id="comics" n={sec("comics")!.n} title={sec("comics")!.title}>
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

        {sec("games") && anyGame && (
          <IssueSection id="games" n={sec("games")!.n} title={sec("games")!.title}>
            {lastWeek && <LastWeekBox lastWeek={lastWeek} />}
            {[
              games.satellite && (
                <SatelliteSpot key="sat" gameId={games.satellite.id} publishDay={settings.publishDay}
                  data={games.satellite.data as unknown as Parameters<typeof SatelliteSpot>[0]["data"]} />
              ),
              games.geoguesser && (
                <GeoGuesser key="geo" gameId={games.geoguesser.id}
                  data={games.geoguesser.data as unknown as Parameters<typeof GeoGuesser>[0]["data"]} />
              ),
              games.crossword && (
                <GISCrossword key="cw" gameId={games.crossword.id}
                  data={games.crossword.data as unknown as Parameters<typeof GISCrossword>[0]["data"]} />
              ),
            ].filter(Boolean).map((game, i, all) => (
              <div key={i} className={`${i > 0 ? "pt-8 sm:pt-9" : ""} ${i < all.length - 1 ? "pb-8 sm:pb-9 border-b border-hair" : ""}`}>
                {game}
              </div>
            ))}
          </IssueSection>
        )}

        {sec("events") && (
          <IssueSection id="events" n={sec("events")!.n} title={sec("events")!.title}>
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

        {sec("data") && (
          <IssueSection id="data" n={sec("data")!.n} title={sec("data")!.title} aside={`${datasets.length} this week`}>
            <p className="-mt-3 mb-3 font-sans text-[15.5px] leading-[1.5] text-ink-3">New open datasets released this week. Each one is checked by hand.</p>
            {/* Table on tablet and up; one card per dataset on phones. */}
            <div className="hidden sm:grid grid-cols-[minmax(0,2.2fr)_110px_120px_100px_90px] gap-4 py-2 border-b border-ink font-sans font-semibold text-[10.5px] tracking-nav uppercase text-meta">
              <span>Dataset</span><span>Format</span><span>Licence</span><span>Resolution</span><span />
            </div>
            {datasets.map(x => (
              <div key={x.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2.2fr)_110px_120px_100px_90px] gap-x-4 gap-y-2 sm:items-center py-3.5 border-b border-hair">
                <div>
                  <div className="flex gap-2 items-center mb-1.5"><RegionPill region={x.region} />
                    {x.link_status === "broken" && <span className="font-sans font-semibold text-[10.5px] tracking-meta uppercase text-danger">Link broken</span>}
                  </div>
                  <div className="font-display font-semibold text-[17.5px] leading-[1.3]">{x.name}</div>
                  {x.publisher && <div className="font-sans text-[15px] sm:text-[13.5px] text-ink-3 mt-0.5">{x.publisher}</div>}
                </div>
                <span className="justify-self-start font-mono font-medium text-xs px-1.5 py-1 bg-paper-2 border border-hair">{x.format}</span>
                <span className="font-sans text-[15px] sm:text-sm text-ink-2"><span className="sm:hidden text-meta">Licence: </span>{x.licence || "—"}</span>
                <span className="font-sans text-[15px] sm:text-sm text-ink-2"><span className="sm:hidden text-meta">Resolution: </span>{x.resolution || "—"}</span>
                <a href={x.url} target="_blank" rel="noopener noreferrer"
                  className="sm:justify-self-end flex items-center min-h-11 sm:min-h-0 font-sans font-semibold text-[11.5px] tracking-meta uppercase text-accent hover:text-accent-deep whitespace-nowrap">
                  Get data ↗
                </a>
              </div>
            ))}
          </IssueSection>
        )}

        {issue.teaser && (
          <p className="border-t-2 border-ink pt-4 pb-2 font-serif italic text-[17px] sm:text-lg leading-[1.55] text-ink-2">
            <b className="not-italic font-sans font-bold text-label tracking-label uppercase text-accent mr-2">Next {settings.publishDay}</b>
            {issue.teaser}
          </p>
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

/** "If you read one thing" plus the games teaser, directly under the headline. */
const HooksStrip = ({ d }: { d: IssueData }) => {
  const { mustRead, gamesTeaser: g } = d
  if (!mustRead && !g) return null
  return (
    <div className={`grid grid-cols-1 ${mustRead && g ? "sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""} border-t border-ink border-b mt-[18px] sm:mt-[22px]`}>
      {mustRead && (
        <a href={`#story-${mustRead.id}`} className="block py-3 sm:py-3.5 sm:pr-5 text-ink hover:text-accent border-b border-hair sm:border-b-0">
          <Label>If you read one thing</Label>
          <div className="font-display font-semibold text-[17px] sm:text-h3 leading-[1.3] mt-1.5 sm:mt-2">{mustRead.title} →</div>
        </a>
      )}
      {g && (
        <a href="#games" className={`block py-3 sm:py-3.5 text-ink hover:text-accent ${mustRead ? "sm:pl-5 sm:border-l sm:border-hair" : ""}`}>
          <Label>Games</Label>
          <div className="font-sans text-[15px] leading-[1.45] text-ink-2 mt-1.5 sm:mt-2">
            {g.lastAnswer && <>Last week: <b>{g.lastAnswer}</b>.{g.pctCorrect != null && ` ${g.pctCorrect}% got it.`} </>}
            {g.thisWeek || "Play this week's puzzles"} →
          </div>
        </a>
      )}
    </div>
  )
}

const COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }

/** Last week's game answers, at the top of Games. */
const LastWeekBox = ({ lastWeek }: { lastWeek: NonNullable<IssueData["lastWeek"]> }) => (
  <div className="bg-paper-2 border-t-2 border-ink px-4 pt-4 pb-5 sm:px-5 mb-8">
    <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1 mb-3.5">
      <Label>Last week&apos;s answers · Issue #{lastWeek.issueNumber}</Label>
      <span className="font-sans font-medium text-xs text-meta">{lastWeek.players} {lastWeek.players === 1 ? "reader" : "readers"} played</span>
    </div>
    <div className={`grid grid-cols-1 ${COLS[Math.min(lastWeek.games.length, 3)]} gap-y-4`}>
      {lastWeek.games.map((g, i) => (
        <div key={g.type} className={i ? "sm:border-l sm:border-hair sm:pl-[18px]" : "sm:pr-[18px]"}>
          <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta">{g.label}</div>
          <div className="font-display font-bold text-h3 leading-[1.25] mt-1.5">{g.answer}</div>
          <div className="font-sans text-[15px] sm:text-sm leading-[1.45] text-ink-3 mt-1">
            {g.type === "geoguesser"
              ? (g.closestKm != null ? `Closest pin: ${g.closestKm} km away` : "No pins dropped")
              : g.type === "crossword"
                ? <Link href={`/issues/${lastWeek.slug}#games`} className="text-accent hover:text-accent-deep">See the full grid →</Link>
                : (g.pctCorrect != null ? `${g.pctCorrect}% got it right` : "No plays yet")}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default IssuePage
