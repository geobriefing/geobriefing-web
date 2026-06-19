export const revalidate = 0

import { supabase } from "@/lib/supabase"
import { Issue } from "@/types"
import Link from "next/link"
import Header from "@/components/Header"

const IssuesPage = async () => {
  const { data } = await supabase
    .from("issues")
    .select("id, issue_number, slug, headline, editor_note, published_at, status")
    .eq("status", "published")
    .order("issue_number", { ascending: false })

  const issues = (data || []) as Issue[]

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-serif">

      <Header active="all-issues" topLeftLabel="All issues" />

      <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-6">
        All issues
      </h2>

      <div className="flex flex-col gap-0">
        {issues.map((issue) => (
          <div key={issue.id} className="border-b border-gray-200 py-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase">
                    {`Issue #${issue.issue_number}`}
                  </span>
                  <span className="text-xs font-sans text-gray-400">
                    {issue.published_at
                      ? new Date(issue.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                      : ""}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold leading-snug mb-2">{issue.headline}</h3>
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
            </div>
          </div>
        ))}
      </div>

      <footer className="border-t-2 border-[#1a1a1a] pt-4 mt-8 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center">
        <span className="text-xs font-sans text-gray-400">2026 GeoBriefing</span>
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">Back to latest issue</Link>
      </footer>

    </div>
  )
}

export default IssuesPage