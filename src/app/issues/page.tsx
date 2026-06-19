export const revalidate = 0

import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Logo from "@/components/Logo"

interface IssueListItem {
  id: string
  issue_number: number
  slug: string
  headline: string
  editor_note: string | null
  published_at: string | null
}

const IssuesPage = async () => {
  const { data: issuesData } = await supabase
    .from("issues")
    .select("id, issue_number, slug, headline, editor_note, published_at")
    .eq("status", "published")
    .order("issue_number", { ascending: false })

  const issues = (issuesData || []) as IssueListItem[]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Link href="/"><Logo size="lg" /></Link>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
      </header>

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase">
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">This week</Link>
        <Link href="/issues" className="text-[#1a6b3c] font-bold">All issues</Link>
        <Link href="/jobs" className="text-gray-500 hover:text-[#1a1a1a]">Jobs</Link>
        <Link href="/about" className="text-gray-500 hover:text-[#1a1a1a]">About</Link>
        <Link href="/subscribe" className="text-gray-500 hover:text-[#1a1a1a]">Subscribe</Link>
      </nav>

      <h1 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-6">
        All issues
      </h1>

      <div className="flex flex-col gap-0">
        {issues.map((issue, i) => (
          <div key={issue.id} className={`py-6 ${i < issues.length - 1 ? "border-b border-gray-200" : ""}`}>
            <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-1">
              Issue #{issue.issue_number} · {issue.published_at
                ? new Date(issue.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            </p>
            <h2 className="text-xl font-bold leading-snug mb-2">{issue.headline}</h2>
            {issue.editor_note && (
              <p className="text-sm font-sans text-gray-500 leading-relaxed mb-2 line-clamp-2">
                {issue.editor_note}
              </p>
            )}
            <Link href={`/issues/${issue.slug}`}
              className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
              Read →
            </Link>
          </div>
        ))}

        {issues.length === 0 && (
          <p className="text-sm font-sans text-gray-400 italic py-8 text-center">
            No issues published yet.
          </p>
        )}
      </div>

      <div className="border-t-2 border-[#1a1a1a] pt-6 mt-8 flex justify-between items-center">
        <span className="text-xs font-sans text-gray-400">2026 GeoBriefing</span>
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">
          Back to latest issue
        </Link>
      </div>

    </div>
  )
}

export default IssuesPage
