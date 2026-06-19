import Link from "next/link"
import Logo from "@/components/Logo"

type AdminNavKey = "comics" | "maps" | "content" | "settings"

interface AdminHeaderProps {
  active: AdminNavKey
  /** Small-caps label shown top-left, e.g. "Admin · Comics" */
  topLeftLabel: string
  onLogout: () => void
}

const NAV_ITEMS: { key: AdminNavKey; label: string; href: string }[] = [
  { key: "comics", label: "Comics", href: "/admin/comics" },
  { key: "maps", label: "Maps", href: "/admin/maps" },
  { key: "content", label: "Content", href: "/admin/content" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
]

const AdminHeader = ({ active, topLeftLabel, onLogout }: AdminHeaderProps) => {
  return (
    <>
      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-3">
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">{topLeftLabel}</span>
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">geobriefing.com</span>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-6 py-3 sm:py-4 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Logo size="lg" />
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mt-2">
          <span className="text-xs font-sans text-gray-500">South Asia · Middle East · Central Asia · Global</span>
          <span className="text-xs font-sans text-gray-500">Free weekly · GIS intelligence</span>
        </div>
      </header>

      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6 py-2 border-b border-gray-300 mb-6 sm:mb-8 font-sans text-xs tracking-widest uppercase">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex-shrink-0 ${active === item.key ? "text-[#1a6b3c] font-bold" : "text-gray-500 hover:text-[#1a1a1a]"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/" className="flex-shrink-0 text-gray-500 hover:text-[#1a1a1a]">View site</Link>
        </div>
        <button onClick={onLogout} className="flex-shrink-0 text-red-400 hover:text-red-600 font-bold sm:ml-auto">
          Logout
        </button>
      </nav>
    </>
  )
}

export default AdminHeader