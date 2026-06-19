import Link from "next/link"
import Logo from "@/components/Logo"

type NavKey = "this-week" | "all-issues" | "jobs" | "about" | "subscribe"

interface HeaderProps {
  /** Which nav item to highlight as active */
  active: NavKey
  /** Small-caps label shown top-left, e.g. "ISSUE #4 · 19 JUNE 2026" or "ABOUT" or "SUBSCRIBE" */
  topLeftLabel?: string
  /** Whether to show the "South Asia · Middle East..." / "Free weekly..." row under the logo. Defaults to true. */
  showTagline?: boolean
}

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "this-week", label: "This week", href: "/" },
  { key: "all-issues", label: "All issues", href: "/issues" },
  { key: "jobs", label: "Jobs", href: "/jobs" },
  { key: "about", label: "About", href: "/about" },
  { key: "subscribe", label: "Subscribe", href: "/subscribe" },
]

const Header = ({ active, topLeftLabel, showTagline = true }: HeaderProps) => {
  return (
    <>
      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        {(topLeftLabel || true) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3">
            <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">
              {topLeftLabel || ""}
            </span>
            <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">geobriefing.com</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-3 sm:gap-6 py-3 sm:py-4 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Logo size="lg" />
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        {showTagline && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mt-2">
            <span className="text-xs font-sans text-gray-500">South Asia · Middle East · Central Asia · Global</span>
            <span className="text-xs font-sans text-gray-500">Free weekly · GIS intelligence</span>
          </div>
        )}
      </header>

      <nav className="flex gap-4 sm:gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase overflow-x-auto whitespace-nowrap">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex-shrink-0 ${active === item.key ? "text-[#1a6b3c] font-bold" : "text-gray-500 hover:text-[#1a1a1a]"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}

export default Header