import Link from "next/link"
import Wordmark from "@/components/Wordmark"
import EditionToggle from "@/components/EditionToggle"
import { getSettings } from "@/lib/settings"

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "Read", links: [{ label: "This week", href: "/" }, { label: "All issues", href: "/issues" }] },
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
  const { publishDay } = await getSettings()
  const year = new Date().getFullYear()

  return (
    <footer className={`${maxWidth} mx-auto px-4 sm:px-6 pb-10 font-sans text-ink`}>
      <div className="h-0.5 bg-ink" />
      <div className="flex flex-wrap justify-between gap-x-12 gap-y-7 pt-7 pb-6">
        <div className="flex-[1_1_260px] max-w-[380px]">
          <Wordmark size={26} />
          <p className="mt-3 text-[15px] sm:text-sm leading-[1.55] text-ink-3 text-pretty">
            A free weekly briefing for the global geospatial community, with a focus on South Asia, the Middle East
            and Central Asia. Independent. No ads. Every {publishDay} afternoon.
          </p>
        </div>
        <div className="flex flex-wrap gap-12">
          {COLUMNS.map(col => (
            <div key={col.title} className="flex flex-col sm:gap-[9px] text-[15px] sm:text-sm">
              <span className="font-bold text-[10.5px] leading-none tracking-label uppercase text-accent mb-1">{col.title}</span>
              {col.links.map(l => (
                <Link key={l.href} href={l.href} className="flex items-center min-h-11 sm:min-h-0 text-ink hover:text-accent">{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-hair pt-3.5 flex flex-wrap justify-between items-center gap-2 font-medium text-[10.5px] leading-[1.4] tracking-meta uppercase text-meta">
        <span>© {year} GeoBriefing</span>
        <EditionToggle />
        <span>Spatial intelligence · Weekly</span>
      </div>
    </footer>
  )
}

export default Footer
