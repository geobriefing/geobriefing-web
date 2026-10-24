import { Fragment } from "react"

/**
 * Small Markdown renderer for Features: headings, paragraphs, lists, quotes, rules,
 * **bold**, _italic_ and [links](https://…). Builds React elements, never raw HTML.
 */

const inline = (text: string, key: string): React.ReactNode[] => {
  const out: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    const k = `${key}-${i++}`
    if (t.startsWith("**") || t.startsWith("__")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith("[")) {
      const label = t.slice(1, t.indexOf("]"))
      out.push(<a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-[3px] decoration-1 hover:text-accent-deep">{label}</a>)
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const Markdown = ({ source, className = "" }: { source: string; className?: string }) => {
  const blocks = (source || "").replace(/\r/g, "").split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
  return (
    <div className={className}>
      {blocks.map((block, bi) => {
        const key = `b${bi}`
        const lines = block.split("\n")
        if (/^-{3,}$|^\*{3,}$/.test(block)) return <hr key={key} className="my-6 border-0 h-px bg-hair" />
        const heading = block.match(/^(#{1,4})\s+(.*)$/)
        if (heading && lines.length === 1) {
          return heading[1].length <= 2
            ? <h4 key={key} className="font-display font-bold text-h2 leading-[1.2] mt-8 mb-3">{inline(heading[2], key)}</h4>
            : <h5 key={key} className="font-display font-semibold text-h3 leading-[1.3] mt-6 mb-2">{inline(heading[2], key)}</h5>
        }
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={key} className="list-disc pl-6 mb-5 flex flex-col gap-1.5">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${key}-${li}`)}</li>)}
            </ul>
          )
        }
        if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) {
          return (
            <ol key={key} className="list-decimal pl-6 mb-5 flex flex-col gap-1.5">
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${key}-${li}`)}</li>)}
            </ol>
          )
        }
        if (lines.every(l => l.startsWith(">"))) {
          return (
            <blockquote key={key} className="my-7 py-[18px] border-y border-ink font-serif italic text-[22px] sm:text-[26px] leading-[1.35] text-ink">
              {inline(lines.map(l => l.replace(/^>\s?/, "")).join(" "), key)}
            </blockquote>
          )
        }
        return (
          <p key={key} className="mb-5 last:mb-0">
            {lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{inline(l, `${key}-${li}`)}</Fragment>)}
          </p>
        )
      })}
    </div>
  )
}

export default Markdown
