import Link from "next/link"
import Wordmark from "@/components/Wordmark"

type AdminNavKey = "review" | "comics" | "maps" | "content" | "settings"

interface AdminHeaderProps {
  active: AdminNavKey
  onLogout: () => void
}

const NAV_ITEMS: { key: AdminNavKey; label: string; href: string }[] = [
  { key: "review", label: "Editor's Desk", href: "/admin/review" },
  { key: "comics", label: "Comics", href: "/admin/comics" },
  { key: "maps", label: "Maps", href: "/admin/maps" },
  { key: "content", label: "Content", href: "/admin/content" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
]

/**
 * Compact admin bar. Desktop: one row with wordmark, Admin badge, nav, View site and Logout.
 * Mobile: wordmark and badge on row 1, a sideways-scrolling nav (ending in Logout) on row 2.
 */
const AdminHeader = ({ active, onLogout }: AdminHeaderProps) => (
  <header className="max-w-[1180px] mx-auto px-4 sm:px-6 pt-3.5">
    <div className="h-[3px] bg-ink" />
    <div className="flex flex-wrap items-center gap-x-6 pt-3 sm:py-3 border-b-2 border-ink">
      <Link href="/admin/review" className="text-ink hover:text-ink"><Wordmark size={24} /></Link>
      <span className="ml-3 sm:ml-0 font-sans font-bold text-[10.5px] leading-none tracking-button uppercase text-danger border border-danger px-[7px] py-1">
        Admin
      </span>
      <nav className="w-full sm:w-auto sm:flex-1 flex items-center gap-5 sm:gap-6 mt-1 sm:mt-0 overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active === item.key ? "page" : undefined}
            className={`flex-none flex items-center min-h-11 sm:min-h-0 whitespace-nowrap font-sans text-xs tracking-nav uppercase hover:text-accent ${
              active === item.key ? "text-accent font-bold" : "text-ink font-medium"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={onLogout}
          className="sm:hidden flex-none min-h-11 font-sans font-bold text-xs tracking-nav uppercase text-danger cursor-pointer">
          Logout
        </button>
      </nav>
      <div className="hidden sm:flex items-center gap-5 ml-auto">
        <Link href="/" target="_blank" className="font-sans font-medium text-xs tracking-nav uppercase text-meta hover:text-accent">
          View site ↗
        </Link>
        <button type="button" onClick={onLogout} className="font-sans font-bold text-xs tracking-nav uppercase text-danger cursor-pointer">
          Logout
        </button>
      </div>
    </div>
  </header>
)

export default AdminHeader
