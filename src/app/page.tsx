export const revalidate = 0

import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getSettings } from "@/lib/settings"
import { getIssue, latestIssueNumber, type IssueData } from "@/lib/issue"
import { dateParts, formatDate, pad2, readTime } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import SubscribeForm from "@/components/SubscribeForm"
import { RegionPill, TypePill } from "@/components/Pills"
import {
  DateBlock, EditorNote, FactBox, ImagePlaceholder, JokeCallout, Label, Meta, PrimaryLink,
  QuoteCallout, SectionLabel, SectionRule, TextLink,
} from "@/components/Editorial"

interface PastIssue { id: string; issue_number: number; slug: string; headline: string; published_at: string | null }

const TOC_TEASER: Record<string, (d: IssueData) => string> = {
  news: d => {
    const regions = new Set(d.stories.map(s => s.region)).size
    return `${d.stories.length} ${d.stories.length === 1 ? "story" : "stories"} from ${regions} ${regions === 1 ? "region" : "regions"}.`
  },
  country: d => `${d.countryDesk?.country}, in depth from local-language sources.`,
  story: d => d.gisStory?.title || "",
  maps: d => d.map?.title || "",
  comics: d => d.comics[0]?.title || "",
  games: d => `${d.gamesTeaser?.thisWeek || "New puzzles this week."}${d.lastWeek ? " Plus last week's answers." : ""}`,
  events: d => `${d.events.length} upcoming, starting with ${d.events[0]?.name}.`,
  data: d => `${d.datasets.length} new open ${d.datasets.length === 1 ? "dataset" : "datasets"}, with format and licence.`,
}

const HomePage = async () => {
  const [latest, settings] = await Promise.all([latestIssueNumber(), getSettings()])
  const d = latest != null ? await getIssue(latest) : null

  if (!d) {
    return (
      <div className="min-h-screen">
        <Masthead active="this-week" />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="font-display font-bold text-[30px] sm:text-display">The first issue is on its way</h1>
          <p className="mt-4 font-serif text-lg text-ink-2">Subscribe and it will arrive on {settings.publishDay} afternoon.</p>
          <div className="mt-8"><PrimaryLink href="/subscribe">Subscribe</PrimaryLink></div>
        </main>
        <Footer />
      </div>
    )
  }

  const { issue, stories, comics, events, quote, gisStory, countryDesk, datasets } = d
  const mapItem = d.map
  const { data: pastData } = await supabase.from("issues").select("id,issue_number,slug,headline,published_at")
    .eq("status", "published").lt("issue_number", issue.issue_number)
    .order("issue_number", { ascending: false }).limit(5)
  const past = (pastData || []) as PastIssue[]
  const joke = d.jokes[0]
  const fact = d.facts[0]
  const href = `/issues/${issue.slug}`
  const minutes = d.readTimeMinutes

  // Table of contents: the issue's own numbered sections, so numbering always matches.
  const toc = d.sections.map(s => ({ title: s.id === "news" ? "GIS News" : s.title, teaser: TOC_TEASER[s.id](d), anchor: s.id }))

  const [lead, ...rest] = stories
  const nextEvent = events[0]

  return (
    <div className="min-h-screen">
      <Masthead active="this-week" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Lead */}
        <section className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] pt-6 sm:pt-9 pb-7 sm:pb-10">
          <div className="md:pr-8">
            <SectionLabel className="mb-3.5 sm:mb-[18px]">This week&apos;s briefing</SectionLabel>
            <h1 className="font-display font-bold text-[30px] sm:text-[44px] leading-[1.08] sm:leading-[1.06] tracking-[-0.015em] text-balance">
              {issue.headline}
            </h1>
            <Meta className="mt-2.5 sm:mt-3.5">
              {formatDate(issue.published_at, "weekday")} · {minutes} min read
              {stories.length > 0 && ` · ${stories.length} ${stories.length === 1 ? "story" : "stories"}`}
            </Meta>
            {quote && <QuoteCallout text={quote.quote_text} author={quote.quote_author} role={quote.quote_role} className="my-5 sm:my-[26px]" />}
            {issue.editor_note && (
              <div className={quote ? "" : "mt-5 sm:mt-[26px]"}>
                <EditorNote note={issue.editor_note} name={settings.editorName} photoUrl={settings.editorPhotoUrl} />
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 mt-[18px] sm:mt-[26px]">
              <PrimaryLink href={href} className="text-center">Read full issue →</PrimaryLink>
              <TextLink href="/issues" className="self-start sm:self-auto">Past issues</TextLink>
            </div>
          </div>

          {toc.length > 0 && (
            <aside className="mt-8 md:mt-0 border-t border-ink pt-3.5 md:border-t-0 md:pt-0 md:border-l md:border-hair md:pl-7">
              <SectionLabel className="mb-1.5">In this issue</SectionLabel>
              {toc.map((t, i) => (
                <Link key={t.anchor} href={`${href}#${t.anchor}`}
                  className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-2 py-3 border-b border-hair text-ink hover:text-accent">
                  <span className="font-mono text-[11px] leading-[1.9] text-accent">{pad2(i + 1)}</span>
                  <span>
                    <span className="block font-display font-bold text-base sm:text-[17px] leading-[1.25]">{t.title}</span>
                    <span className="block font-sans text-[15px] sm:text-sm leading-[1.45] text-ink-3 mt-[3px]">{t.teaser}</span>
                  </span>
                </Link>
              ))}
            </aside>
          )}
        </section>

        {/* Top stories + sidebar */}
        {stories.length > 0 && (
          <>
            <SectionRule />
            <section className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] pt-6 sm:pt-8 pb-8 sm:pb-10">
              <div className="md:pr-8">
                <SectionLabel>Top stories</SectionLabel>
                <div className={`grid grid-cols-1 ${rest.length > 0 ? "sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""}`}>
                  <article className={rest.length > 0 ? "sm:pr-6 sm:border-r sm:border-hair" : ""}>
                    <div className="flex flex-wrap gap-2 items-center mb-2.5">
                      <RegionPill region={lead.region} />
                      {lead.topic && <Meta className="text-[11px]">{lead.topic}</Meta>}
                    </div>
                    <h2 className="font-display font-bold text-[22px] sm:text-[25px] leading-[1.18] tracking-[-0.005em] text-balance">
                      <Link href={`${href}#news`} className="text-ink hover:text-accent">{lead.title}</Link>
                    </h2>
                    {lead.summary && <p className="mt-2.5 font-sans text-[15px] sm:text-base leading-[1.55] text-ink-3 text-pretty">{lead.summary}</p>}
                    {lead.source_name && <Meta className="mt-3 text-[11.5px] tracking-[.1em]">Source: {lead.source_name}</Meta>}
                  </article>
                  {rest.length > 0 && (
                    <div className="mt-6 sm:mt-0 sm:pl-6">
                      {rest.slice(0, 3).map((s, i, a) => (
                        <article key={s.id} className={`pb-4 mb-4 ${i < a.length - 1 ? "border-b border-hair" : ""} ${i === 0 ? "border-t border-hair pt-4 sm:border-t-0 sm:pt-0" : ""}`}>
                          <div className="flex flex-wrap gap-2 items-center mb-2">
                            <RegionPill region={s.region} />
                            {s.topic && <Meta className="text-[11px]">{s.topic}</Meta>}
                          </div>
                          <h3 className="font-display font-semibold text-lg sm:text-h3 leading-[1.28] text-pretty">
                            <Link href={`${href}#news`} className="text-ink hover:text-accent">{s.title}</Link>
                          </h3>
                          {s.summary && <p className="mt-1.5 font-sans text-[15px] sm:text-[14.5px] leading-[1.5] text-ink-3 line-clamp-2">{s.summary}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(joke || fact || nextEvent) && (
                <aside className="mt-6 md:mt-0 md:border-l md:border-hair md:pl-7 flex flex-col gap-7">
                  {joke && <JokeCallout setup={joke.setup} punchline={joke.punchline} />}
                  {fact && <FactBox fact={fact.fact} source={fact.source} />}
                  {nextEvent && (
                    <div>
                      <SectionLabel className="mb-3.5">Next event</SectionLabel>
                      <div className="flex gap-3.5">
                        <DateBlock {...dateParts(nextEvent.start_date)} />
                        <div>
                          <a href={nextEvent.url} target="_blank" rel="noopener noreferrer"
                            className="font-display font-semibold text-[17px] leading-[1.25] text-ink hover:text-accent">{nextEvent.name}</a>
                          <div className="font-sans text-[15px] sm:text-[13.5px] leading-[1.4] text-ink-3 mt-1 mb-2">
                            {[nextEvent.location, nextEvent.is_online && nextEvent.location !== "Online" ? "Online" : null].filter(Boolean).join(" · ")}
                          </div>
                          <TypePill kind="event" value={nextEvent.event_type} />
                        </div>
                      </div>
                    </div>
                  )}
                </aside>
              )}
            </section>
          </>
        )}

        {/* Country desk band */}
        {countryDesk && (
          <>
            <SectionRule />
            <section className="pt-6 sm:pt-8 pb-8 sm:pb-10">
              <SectionLabel className="mb-5" aside={
                <span className="hidden sm:inline font-sans font-medium text-label tracking-meta uppercase text-meta">A different country each week</span>
              }>Country desk</SectionLabel>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] gap-6 md:gap-8 items-start">
                <div>
                  <div className="flex items-center gap-2.5">
                    <RegionPill region={countryDesk.region} />
                    {countryDesk.desk_number && <span className="font-mono text-[11px] text-meta">Desk {pad2(countryDesk.desk_number)} of the series</span>}
                  </div>
                  <h2 className="mt-3 font-display font-bold text-[34px] sm:text-[44px] leading-none tracking-[-0.015em]">{countryDesk.country}</h2>
                  <p className="mt-3 mb-4 font-serif text-[17px] leading-[1.6] text-ink-2 text-pretty line-clamp-4">{countryDesk.intro}</p>
                  <TextLink href={`${href}#country`}>Read the desk →</TextLink>
                </div>
                {countryDesk.facts.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-ink">
                    {countryDesk.facts.slice(0, 4).map((f, i) => (
                      <div key={f.key} className={`py-3.5 border-b border-hair ${i % 2 === 0 ? "sm:pr-4 sm:border-r" : "sm:pl-4"}`}>
                        <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta">{f.key}</div>
                        <div className="font-display font-semibold text-[17px] leading-[1.3] mt-1">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Story · Maps · Comics */}
        {(gisStory || mapItem || comics.length > 0 || datasets.length > 0) && (
          <>
            <SectionRule />
            <section className="grid grid-cols-1 md:grid-cols-3 pt-6 sm:pt-8 pb-8 sm:pb-10 gap-y-8">
              {gisStory && (
                <div className="md:pr-6">
                  <SectionLabel className="mb-4">GIS Story</SectionLabel>
                  <h3 className="font-display font-bold text-[22px] sm:text-2xl leading-[1.18] text-balance">{gisStory.title}</h3>
                  <p className="mt-2.5 font-serif text-base leading-[1.6] text-ink-2 line-clamp-5 text-pretty">{gisStory.content}</p>
                  <Meta className="text-[11.5px] tracking-[.1em] mt-3 mb-4">{readTime([gisStory.content])} min read</Meta>
                  <TextLink href={`${href}#story`}>Read the story →</TextLink>
                </div>
              )}
              {mapItem && (
                <div className={`${gisStory ? "md:px-6 md:border-l md:border-hair" : "md:pr-6"}`}>
                  <SectionLabel className="mb-4">Maps Don&apos;t Lie</SectionLabel>
                  <Link href={`${href}#maps`} className="block text-ink hover:text-accent">
                    {mapItem.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" src={mapItem.image_url} alt={mapItem.title} className="w-full aspect-[4/3] object-cover border border-hair" />
                    ) : (
                      <ImagePlaceholder label="Map image pending" className="aspect-[4/3]" />
                    )}
                    <div className="mt-3 mb-2"><TypePill kind="map" value={mapItem.map_type} /></div>
                    <h3 className="font-display font-semibold text-lg sm:text-h3 leading-[1.28]">{mapItem.title}</h3>
                  </Link>
                  <p className="mt-1.5 font-sans text-[15px] sm:text-[14.5px] leading-[1.5] text-ink-3 line-clamp-3">{mapItem.commentary}</p>
                </div>
              )}
              {(comics.length > 0 || datasets.length > 0) && (
                <div className={`${gisStory || mapItem ? "md:pl-6 md:border-l md:border-hair" : ""}`}>
                  {comics.length > 0 && (<>
                  <SectionLabel className="mb-4">Comics</SectionLabel>
                  <Link href={`${href}#comics`} className="grid grid-cols-2 gap-2">
                    {comics.slice(0, 2).map(c => c.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" key={c.id} src={c.image_url} alt={c.title} className="w-full aspect-square object-cover border border-hair" />
                    ) : (
                      <ImagePlaceholder key={c.id} label={c.title} className="aspect-square" />
                    ))}
                  </Link>
                  <div className="font-sans text-[13.5px] leading-[1.4] text-ink-3 mt-2">{comics[0].title}</div>
                  <TextLink href={`${href}#comics`} className="mt-3">
                    {comics.length === 1 ? "Read the strip →" : `All ${comics.length} strips →`}
                  </TextLink>
                  </>)}
                  {datasets.length > 0 && (
                    <>
                      <SectionLabel className={`${comics.length ? "mt-6" : ""} mb-1`}>Data drops</SectionLabel>
                      {datasets.slice(0, 3).map(x => (
                        <Link key={x.id} href={`${href}#data`} className="flex justify-between gap-2.5 py-2.5 border-b border-hair text-ink hover:text-accent">
                          <span>
                            <span className="block font-display font-semibold text-[15px] leading-[1.3]">{x.name}</span>
                            {x.publisher && <span className="block font-sans text-[13px] leading-[1.4] text-meta">{x.publisher}</span>}
                          </span>
                          <span className="flex-none self-start font-mono font-medium text-[10.5px] leading-none px-1.5 py-1 text-ink bg-paper-2 border border-hair">{x.format}</span>
                        </Link>
                      ))}
                      <TextLink href={`${href}#data`} className="mt-3">
                        {datasets.length === 1 ? "The dataset →" : `All ${datasets.length} in this issue →`}
                      </TextLink>
                    </>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        {/* Past issues */}
        {past.length > 0 && (
          <>
            <SectionRule />
            <section className="pt-6 sm:pt-8 pb-8 sm:pb-12">
              <SectionLabel className="mb-1.5" aside={
                <Link href="/issues" className="font-sans font-semibold text-label leading-none tracking-nav uppercase text-accent">All issues →</Link>
              }>Past issues</SectionLabel>
              {past.map(p => (
                <Link key={p.id} href={`/issues/${p.slug}`}
                  className="grid grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 items-baseline py-3 sm:py-3.5 border-b border-hair text-ink hover:text-accent">
                  <span className="font-mono text-[11px] sm:text-[13px] text-meta">
                    #{p.issue_number}<span className="sm:hidden"> · {formatDate(p.published_at, "short")}</span>
                  </span>
                  <span className="font-display font-semibold text-[16.5px] sm:text-h3 leading-[1.3]">{p.headline}</span>
                  <span className="hidden sm:block font-sans font-medium text-caption tracking-meta uppercase text-meta whitespace-nowrap">
                    {formatDate(p.published_at, "short")}
                  </span>
                </Link>
              ))}
            </section>
          </>
        )}

        {/* Subscribe band */}
        <section className="bg-[#1A1A1A] text-[#FAFAF7] -mx-4 sm:mx-0 px-4 py-7 sm:p-10 mb-7 sm:mb-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div>
            <Label className="block mb-3 text-[#7FCF9F]!">Subscribe</Label>
            <div className="font-display font-bold text-[30px] sm:text-[40px] leading-[1.05] tracking-[-0.01em]">Free. Every {settings.publishDay}.</div>
            <p className="mt-2 sm:mt-3 font-sans text-[15px] sm:text-base leading-[1.55] text-[#CFCEC6]">
              One email a week: the news, a country in depth, a story, a map, a comic and a game, with last week&apos;s answers. No ads. Unsubscribe in one click.
            </p>
          </div>
          <SubscribeForm variant="band" publishDay={settings.publishDay} />
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default HomePage
