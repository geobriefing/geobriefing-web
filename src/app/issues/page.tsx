import { supabase } from '@/lib/supabase'
import { Issue } from '@/types'
import Link from 'next/link'

const IssuesPage = async () => {
  const { data } = await supabase
    .from('issues')
    .select('id, issue_number, slug, headline, editor_note, published_at, status')
    .eq('status', 'published')
    .order('issue_number', { ascending: false })

  const issues = (data || []) as Issue[]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <div className="border-t-4 border-b border-[#1a1a1a] mb-6 pt-4 pb-3">
        <div className="flex items-center justify-center gap-6 py-3 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Link href="/" className="text-4xl font-bold tracking-tight text-[#1a1a1a]">
            GeoBriefing
          </Link>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
      </div>

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase">
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">This week</Link>
        <Link href="/issues" className="text-[#1a6b3c] font-bold">All issues</Link>
        <Link href="/subscribe" className="text-gray-500 hover:text-[#1a1a1a]">Subscribe</Link>
      </nav>

      <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-6">
        All issues
      </h2>

      <div className="flex flex-col gap-0">
        {issues.map((issue, i) => (
          <div key={issue.id} className="border-b border-gray-200 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase">
                    {`Issue #${issue.issue_number}`}
                  </span>
                  <span className="text-xs font-sans text-gray-400">
                    {issue.published_at
                      ? new Date(issue.published_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })
                      : ''}
                  </span>
                </div>
                <h3 className="text-xl font-bold leading-snug mb-2">{issue.headline}</h3>
                <p className="text-sm font-sans text-gray-500 leading-relaxed line-clamp-2">
                  {issue.editor_note}
                </p>
              </div>
              <Link
                href={`/issues/${issue.slug}`}
                className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline whitespace-nowrap mt-1"
              >
                Read
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-[#1a1a1a] mt-8 pt-4 flex justify-between items-center">
        <span className="text-xs font-sans text-gray-400">
          2026 GeoBriefing
        </span>
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">
          Back to latest issue
        </Link>
      </div>

    </div>
  )
}

export default IssuesPage