export const revalidate = 0

import Link from "next/link"
import { getSettings } from "@/lib/settings"
import { paragraphs } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import { TypePill } from "@/components/Pills"
import { ImagePlaceholder, Label, SectionLabel } from "@/components/Editorial"

const STEPS: { title: string; text: string; who: "AI-assisted" | "Human" }[] = [
  { title: "Collect", text: "Software gathers candidate stories, events and maps from public sources across the region.", who: "AI-assisted" },
  { title: "Draft", text: "A language model drafts summaries and teasers. They are marked as drafts.", who: "AI-assisted" },
  { title: "Edit", text: "The editor rewrites, cuts and checks every item against its source.", who: "Human" },
  { title: "Review", text: "Each section is reviewed and approved before it is published.", who: "Human" },
]

const AboutPage = async () => {
  const settings = await getSettings()
  const bio = paragraphs(settings.editorBio)
  const mission = paragraphs(settings.editorMission)

  return (
    <div className="min-h-screen">
      <Masthead active="about" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="pt-7 sm:pt-10 pb-6 sm:pb-7 border-b-2 border-ink">
          <Label>About</Label>
          <h1 className="mt-2.5 font-display font-bold text-[30px] sm:text-[44px] leading-[1.08] tracking-[-0.012em] max-w-[760px] text-balance">
            A weekly briefing for people who make and read maps
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] pt-7 sm:pt-8 gap-y-10">
          <div className="md:pr-9">
            <p className="mb-[18px] font-serif text-[17.5px] sm:text-long leading-[1.7] text-ink-2">
              GeoBriefing is a free newsletter and website for the global geospatial community, with a focus on South
              Asia, the Middle East and Central Asia. It comes out every {settings.publishDay} afternoon and covers
              everything that happened in the geospatial world that week. It is independent and carries no
              ads. <Link href="/sources" className="text-accent underline underline-offset-[3px] decoration-1 hover:text-accent-deep">See the sources we read</Link>.
            </p>
            <p className="mb-8 font-serif text-[17.5px] sm:text-long leading-[1.7] text-ink-2">
              Each issue has the week&apos;s GIS news, one longer story, a map worth arguing about, comics, games and
              upcoming events.
            </p>
            {mission.map((p, i) => (
              <p key={i} className="mb-[18px] last:mb-8 font-serif text-[17.5px] sm:text-long leading-[1.7] text-ink-2">{p}</p>
            ))}

            <SectionLabel className="mb-2">How it is made</SectionLabel>
            {STEPS.map((s, i) => (
              <div key={s.title} className="grid grid-cols-[36px_minmax(0,1fr)] sm:grid-cols-[44px_minmax(0,1fr)_auto] gap-x-3.5 gap-y-2 items-baseline py-4 border-b border-hair">
                <span className="font-display font-bold text-[22px] text-accent">{i + 1}</span>
                <div>
                  <div className="font-display font-semibold text-h3 leading-[1.3]">{s.title}</div>
                  <div className="font-sans text-[15.5px] leading-[1.55] text-ink-3 mt-1">{s.text}</div>
                </div>
                <TypePill kind="process" value={s.who} className="col-start-2 sm:col-start-auto justify-self-start" />
              </div>
            ))}
          </div>

          <aside className="md:border-l md:border-hair md:pl-7">
            <SectionLabel className="mb-4">The editor</SectionLabel>
            {settings.editorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={settings.editorPhotoUrl} alt={settings.editorName} className="w-full aspect-[4/5] object-cover border border-hair grayscale" />
            ) : (
              <ImagePlaceholder label="Editor photo" className="aspect-[4/5]" />
            )}
            {settings.editorName && <div className="font-display font-bold text-[22px] leading-[1.2] mt-4">{settings.editorName}</div>}
            <div className="font-sans font-medium text-caption tracking-meta uppercase text-meta mt-1">Founder &amp; editor</div>
            {bio.map((p, i) => (
              <p key={i} className="mt-3 font-sans text-base leading-[1.6] text-ink-2">{p}</p>
            ))}
            <div className="border-l-[3px] border-accent bg-accent-tint px-3.5 py-3 mt-3.5 font-serif text-[15px] leading-[1.5] text-ink-2">
              &ldquo;Reply to any issue. I read every email, and the best replies end up in the next one.&rdquo;
            </div>
            {settings.editorContact && (
              <div className="flex gap-4 mt-3.5 font-sans font-semibold text-[11.5px] tracking-meta uppercase">
                <a href={`mailto:${settings.editorContact}`} className="text-accent hover:text-accent-deep">Email</a>
              </div>
            )}
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AboutPage
