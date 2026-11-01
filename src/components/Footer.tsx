import Link from "next/link"
import Wordmark from "@/components/Wordmark"
import EditionToggle from "@/components/EditionToggle"
import { getSettings } from "@/lib/settings"

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Read", links: [{ label: "Latest issue", href: "/" }, { label: "Archive", href: "/issues" }] },
  {
    title: "GeoBriefing",
    links: [
      { label: "About", href: "/about" },
      { label: "Sources", href: "/sources" },
      { label: "Subscribe", href: "/subscribe" },
    ],
  },
]

const Footer = async ({ maxWidth = "max-w-5xl" }: { maxWidth?: string }) => {
  const { editorName, editorContact } = await getSettings()
  const year = new Date().getFullYear()
  const columns = editorContact
    ? COLUMNS.map((c, i) => i === 1 ? { ...c, links: [...c.links, { label: "Contact", href: `mailto:${editorContact}` }] } : c)
    : COLUMNS

  return (
    <footer className={`${maxWidth} mx-auto px-4 sm:px-6 pb-10 font-sans text-ink`}>
      <div className="h-0.5 bg-ink" />
      <div className="flex flex-wrap justify-between gap-x-12 gap-y-7 pt-7 pb-6">
        <div className="flex-[1_1_260px] max-w-[380px]">
          <Wordmark size={26} />
          <p className="mt-3 text-[15px] sm:text-sm leading-[1.55] text-ink-3 text-pretty">
            An independent monthly publication covering maps, GIS, Earth observation, GeoAI, spatial data and the
            geography behind the stories shaping our world.
          </p>
          <p className="mt-2 text-[15px] sm:text-sm leading-[1.55] text-ink font-semibold">New issue on the 1st of every month.</p>
          {editorName && <p className="mt-1 text-[15px] sm:text-sm leading-[1.55] text-ink-3">Edited by {editorName}</p>}
        </div>
        <div className="flex flex-wrap gap-12">
          {columns.map(col => (
            <div key={col.title} className="flex flex-col sm:gap-[9px] text-[15px] sm:text-sm">
              <span className="font-bold text-[11.5px] leading-none tracking-label uppercase text-accent mb-1">{col.title}</span>
              {col.links.map(l => (
                <Link key={l.href} href={l.href} className="flex items-center min-h-11 sm:min-h-0 text-ink hover:text-accent">{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-hair pt-3.5 flex flex-wrap justify-between items-center gap-2 font-medium text-[11.5px] leading-[1.4] tracking-meta uppercase text-meta">
        <span>© {year} GeoBriefing. All rights reserved.</span>
        <EditionToggle />
        <span>Read the world spatially.</span>
      </div>
    </footer>
  )
}

export default Footer
