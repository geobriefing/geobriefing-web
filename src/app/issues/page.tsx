export const revalidate = 0

import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { formatDate } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import { Label, Meta, PrimaryLink } from "@/components/Editorial"

interface ArchiveIssue { id: string; issue_number: number; slug: string; headline: string; published_at: string | null }

const IssuesPage = async () => {
  const { data } = await supabase
    .from("issues")
    .select("id, issue_number, slug, headline, published_at")
    .eq("status", "published")
    .order("issue_number", { ascending: false })

  const issues = (data || []) as ArchiveIssue[]

  // Group by month of publication, newest first.
  const groups: { month: string; items: ArchiveIssue[] }[] = []
  issues.forEach(issue => {
    const month = formatDate(issue.published_at, "monthYear") || "Undated"
    const last = groups[groups.length - 1]
    if (last && last.month === month) last.items.push(issue)
    else groups.push({ month, items: [issue] })
  })

  const first = issues[issues.length - 1]

  return (
    <div className="min-h-screen">
      <Masthead active="all-issues" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-6 pt-7 sm:pt-10 pb-5 sm:pb-6 border-b-2 border-ink">
          <div>
            <Label>Archive</Label>
            <h1 className="mt-2.5 font-display font-bold text-[30px] sm:text-[44px] leading-[1.05] tracking-[-0.012em]">All issues</h1>
          </div>
          {issues.length > 0 && (
            <Meta>
              {issues.length} {issues.length === 1 ? "issue" : "issues"}
              {first?.published_at ? ` since ${formatDate(first.published_at, "monthYear")}` : ""}
            </Meta>
          )}
        </div>

        {issues.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-serif text-lg text-ink-2">No issues have been published yet.</p>
            <div className="mt-6"><PrimaryLink href="/subscribe">Get the first one</PrimaryLink></div>
          </div>
        )}

        {groups.map(group => (
          <div key={group.month} className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-x-6 pt-6">
            <Label className="sm:pt-[18px]">{group.month}</Label>
            <div>
              {group.items.map(issue => (
                <Link key={issue.id} href={`/issues/${issue.slug}`}
                  className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)_auto] gap-x-4 items-baseline py-3.5 border-b border-hair text-ink hover:text-accent">
                  <span className="font-mono text-[13px] text-meta">#{issue.issue_number}</span>
                  <span className="font-display font-semibold text-lg sm:text-xl leading-[1.3]">{issue.headline}</span>
                  <span className="col-start-2 sm:col-start-auto font-sans font-medium text-caption tracking-meta uppercase text-meta">
                    {formatDate(issue.published_at, "dayMonth")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </main>

      <Footer />
    </div>
  )
}

export default IssuesPage
