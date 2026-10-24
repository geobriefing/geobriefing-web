import Link from "next/link"
import { pad2 } from "@/lib/format"

/** Kicker / section label: 11px bold uppercase accent text. */
export const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`font-sans font-bold text-label tracking-label uppercase text-accent ${className}`}>{children}</span>
)

/** Section label followed by a hairline to the edge, with optional trailing content. */
export const SectionLabel = ({
  children, aside, className = "mb-5",
}: {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <Label className="whitespace-nowrap">{children}</Label>
    <span className="flex-1 h-px bg-hair" />
    {aside}
  </div>
)

/** Uppercase meta line in grey. */
export const Meta = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`font-sans font-medium text-caption tracking-meta uppercase text-meta ${className}`}>{children}</div>
)

export const SectionRule = () => <div className="h-0.5 bg-ink" />

/** Issue page section head: 2px rule, mono number and serif title. */
export const IssueSection = ({
  id, n, title, aside, children, className = "",
}: {
  id: string
  n: number
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) => (
  <section id={id} className={`border-t-2 border-ink pt-3 sm:pt-4 pb-8 sm:pb-12 scroll-mt-4 ${className}`}>
    <div className="flex flex-wrap justify-between items-baseline gap-x-4 gap-y-1 mb-5 sm:mb-7">
      <div className="flex items-baseline gap-2.5 sm:gap-3">
        <span className="font-mono font-semibold text-[11px] sm:text-xs text-accent">{pad2(n)}</span>
        <h2 className="font-display font-bold text-2xl sm:text-[32px] leading-[1.1]">{title}</h2>
      </div>
      {aside && <Meta>{aside}</Meta>}
    </div>
    {children}
  </section>
)

/** Green-bar callout for the editor's voice, with name and round photo. */
export const EditorNote = ({
  note, name, photoUrl, size = "md",
}: {
  note: string
  name: string
  photoUrl: string
  size?: "md" | "lg"
}) => (
  <div className={`border-l-[3px] border-accent bg-accent-tint ${size === "lg" ? "px-4 py-4 sm:px-6 sm:py-5" : "px-4 py-4 sm:px-[22px] sm:py-[18px]"}`}>
    <Label className="block mb-2.5">From the editor</Label>
    <p className={`font-serif text-ink-2 text-pretty ${size === "lg" ? "text-[17px] sm:text-[19px] leading-[1.65]" : "text-[16.5px] sm:text-[17px] leading-[1.6]"}`}>
      {note}
    </p>
    <div className="flex items-center gap-3 mt-3.5">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img loading="lazy" src={photoUrl} alt="" className="flex-none w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-hair-2" />
      ) : (
        <span className="flex-none w-10 h-10 sm:w-11 sm:h-11 rounded-full hatch border border-hair-2" />
      )}
      <div>
        {name && <div className="font-sans font-semibold text-sm text-ink">{name}</div>}
        <div className="font-sans text-[13px] text-ink-3">Hit reply. I read every email.</div>
      </div>
    </div>
  </div>
)

/** Ink-bar pull quote. */
export const QuoteCallout = ({
  text, author, role, sourceUrl, size = "md", className = "",
}: {
  text: string
  author?: string | null
  role?: string | null
  sourceUrl?: string | null
  size?: "md" | "lg"
  className?: string
}) => (
  <div className={`border-l-[3px] border-ink pl-4 sm:pl-[18px] py-0.5 ${className}`}>
    <p className={`font-serif italic text-ink text-pretty leading-[1.4] ${size === "lg" ? "text-[19px] sm:text-[23px]" : "text-[19px] sm:text-[22px]"}`}>
      &ldquo;{text}&rdquo;
    </p>
    {author && (
      <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta mt-2.5">
        Quote of the week · {sourceUrl
          ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{author}{role ? `, ${role}` : ""} ↗</a>
          : <>{author}{role ? `, ${role}` : ""}</>}
      </div>
    )}
  </div>
)

/** Green-bar joke callout. */
export const JokeCallout = ({
  setup, punchline, label = "GIS joke", className = "",
}: {
  setup: string
  punchline?: string | null
  label?: string
  className?: string
}) => (
  <div className={`border-l-[3px] border-accent pl-4 py-0.5 ${className}`}>
    <Label className="block mb-2.5">{label}</Label>
    <p className="font-serif text-[16px] sm:text-[17px] leading-[1.5] text-ink-2">{setup}</p>
    {punchline && <p className="font-serif italic text-[16px] sm:text-[17px] leading-[1.5] text-ink-2 mt-2">{punchline}</p>}
  </div>
)

/** Sunken fact box with a 2px top rule. */
export const FactBox = ({
  label = "Did you know?", fact, source, sourceUrl, figure, className = "",
}: {
  label?: string
  fact: string
  source?: string | null
  sourceUrl?: string | null
  figure?: string
  className?: string
}) => (
  <div className={`bg-paper-2 border-t-2 border-ink px-4 pt-3.5 pb-4 sm:px-[18px] sm:pt-4 sm:pb-[18px] ${className}`}>
    <Label className="block mb-2.5">{label}</Label>
    {figure && <div className="font-display font-bold text-[30px] sm:text-4xl leading-none mb-2">{figure}</div>}
    <p className="font-sans text-[15px] leading-[1.5] text-ink-2">{fact}</p>
    {source && (
      <div className="font-sans text-[13px] text-meta mt-1.5">
        — {sourceUrl ? <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{source} ↗</a> : source}
      </div>
    )}
  </div>
)

/** Ink-filled primary button (link). */
export const PrimaryLink = ({
  href, children, className = "",
}: {
  href: string
  children: React.ReactNode
  className?: string
}) => (
  <Link
    href={href}
    className={`inline-block min-h-11 font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper px-[22px] py-4 hover:bg-accent transition-colors ${className}`}
  >
    {children}
  </Link>
)

/** Underlined uppercase accent link, e.g. "All issues →". */
export const TextLink = ({
  href, children, className = "", external = false,
}: {
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
}) => {
  const cls = `inline-block font-sans font-semibold text-xs leading-none tracking-nav uppercase text-accent border-b border-accent pb-[3px] hover:text-accent-deep hover:border-accent-deep ${className}`
  return external
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
    : <Link href={href} className={cls}>{children}</Link>
}

/** Black month/day block used for events. */
export const DateBlock = ({ mon, day, small = false }: { mon: string; day: string; small?: boolean }) => (
  <div className={`flex-none border border-ink text-center ${small ? "w-[52px]" : "w-[58px] sm:w-[62px]"}`}>
    <div className="bg-ink text-paper font-sans font-bold text-[10px] leading-none tracking-button pt-[5px] pb-1">{mon}</div>
    <div className={`font-display font-bold leading-none pt-[7px] pb-2 ${small ? "text-[22px]" : "text-[26px]"}`}>{day}</div>
  </div>
)

/** Hatched placeholder for an image that has not been supplied yet. */
export const ImagePlaceholder = ({ label, className = "" }: { label: string; className?: string }) => (
  <div className={`hatch border border-hair flex items-end p-2.5 ${className}`}>
    <span className="font-mono text-[11px] text-meta">{label}</span>
  </div>
)
