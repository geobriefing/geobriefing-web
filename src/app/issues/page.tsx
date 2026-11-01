export const revalidate = 0

import Link from "next/link"
import { getArchive } from "@/lib/issue"
import { getSettings } from "@/lib/settings"
import { nextIssueDate } from "@/lib/schedule"
import { formatDate } from "@/lib/format"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import { Label, Meta, PrimaryLink } from "@/components/Editorial"

const IssuesPage = async () => {
  const [{ groups, totalIssues, firstIssueDate }, settings] = await Promise.all([getArchive(), getSettings()])
  const next = nextIssueDate(settings)
  const issues = groups.flatMap(g => g.items)

  return (
    <div className="min-h-dvh">
      <Masthead active="all-issues" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-6 pt-7 sm:pt-10 pb-5 sm:pb-6 border-b-2 border-ink">
          <div>
            <Label>Archive</Label>
            <h1 className="mt-2.5 font-display font-bold text-[30px] sm:text-[44px] leading-[1.05] tracking-[-0.012em]">The archive</h1>
            <p className="mt-2 font-serif text-[17px] leading-[1.6] text-ink-2 max-w-[620px]">
              Every issue, from the beginning. Browse previous editions, revisit Country Desks, find an old dataset or finally
              play the game you confidently told yourself you&apos;d come back to.
            </p>
          </div>
          {issues.length > 0 && (
            <Meta>
              {totalIssues} {totalIssues === 1 ? "issue" : "issues"}
              {firstIssueDate ? ` since ${formatDate(firstIssueDate, "monthYear")}` : ""}
            </Meta>
          )}
        </div>

        {issues.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display font-bold text-[24px] sm:text-[30px]">Nothing to archive. Yet.</p>
            <p className="mt-2 font-serif text-lg text-ink-2">Issue №01 is coming on {next.date}.</p>
            <div className="mt-6"><PrimaryLink href="/subscribe">Get the first issue →</PrimaryLink></div>
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
