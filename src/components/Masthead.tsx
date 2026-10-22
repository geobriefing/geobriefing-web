import Link from "next/link"
import Wordmark from "@/components/Wordmark"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/format"

export type NavKey = "this-week" | "all-issues" | "about" | "sources" | "subscribe"

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "this-week", label: "This week", href: "/" },
  { key: "all-issues", label: "All issues", href: "/issues" },
  { key: "about", label: "About", href: "/about" },
  { key: "sources", label: "Sources", href: "/sources" },
  { key: "subscribe", label: "Subscribe", href: "/subscribe" },
]

/** Public masthead. Issue number and date come from the latest published issue. */
const Masthead = async ({ active, maxWidth = "max-w-5xl" }: { active?: NavKey; maxWidth?: string }) => {
  const { data: latest } = await supabase
    .from("issues")
    .select("issue_number, published_at")
    .eq("status", "published")
    .order("issue_number", { ascending: false })
    .limit(1)
    .maybeSingle()

  const issueLine = latest ? `Issue #${latest.issue_number} · ${formatDate(latest.published_at, "long")}` : ""
  const issueLineShort = latest ? `Issue #${latest.issue_number} · ${formatDate(latest.published_at, "short")}` : ""

  return (
    <header className={`${maxWidth} mx-auto px-4 sm:px-6 pt-3 sm:pt-5`}>
      <div className="h-1 bg-ink" />
      <div className="h-px bg-ink mt-0.5 sm:mt-[3px]" />

      <div className="flex justify-between items-center gap-4 py-[7px] sm:py-[9px] font-sans font-semibold text-[9.5px] sm:text-label leading-[1.2] tracking-nav sm:tracking-button uppercase">
        <span className="sm:hidden">{issueLineShort}</span>
        <span className="hidden sm:inline">{issueLine}</span>
        <span className="text-meta font-medium normal-case tracking-[.04em] sm:tracking-[.06em] text-[10.5px] sm:text-xs">geobriefing.com</span>
      </div>

      <div className="border-y border-ink pt-3.5 pb-[11px] sm:pt-[22px] sm:pb-4 flex flex-col items-center">
        <Link href="/" className="text-ink hover:text-ink">
          <span className="sm:hidden"><Wordmark size={38} /></span>
          <span className="hidden sm:inline"><Wordmark size={60} /></span>
        </Link>
        <div className="w-[210px] sm:w-[330px] h-px bg-ink mt-[9px] sm:mt-3" />
        <div className="font-sans font-semibold text-[7.5px] sm:text-[9.5px] leading-none tracking-[.34em] sm:tracking-[.42em] pl-[.34em] sm:pl-[.42em] uppercase mt-[7px] sm:mt-[9px]">
          Spatial Intelligence · Weekly
        </div>
      </div>

      <div className="flex justify-center sm:justify-between gap-4 py-[7px] sm:py-[9px] font-sans font-medium text-[9.5px] sm:text-label leading-[1.2] tracking-[.1em] sm:tracking-meta uppercase text-meta border-b border-hair">
        <span className="sm:hidden">S. Asia · Middle East · C. Asia · Global</span>
        <span className="hidden sm:inline">South Asia · Middle East · Central Asia · Global</span>
        <span className="hidden sm:inline">Free weekly · GIS intelligence</span>
      </div>

      <nav className="flex sm:justify-center items-center gap-[22px] sm:gap-8 border-b-2 border-ink overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={`flex-none flex items-center min-h-11 whitespace-nowrap font-sans text-[11.5px] sm:text-xs tracking-nav sm:tracking-button uppercase hover:text-accent ${
              active === item.key ? "text-accent font-bold" : "text-ink font-medium"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default Masthead
