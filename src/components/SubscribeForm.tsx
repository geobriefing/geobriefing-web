"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

type Variant = "band" | "inline" | "page"
type Status = "idle" | "loading" | "success" | "error"
interface Problem { title: string; body: string; link?: { href: string; label: string } }

const PROBLEMS = (contactEmail: string): Record<string, Problem> => ({
  already_subscribed: {
    title: "You're already on the list.",
    body: "Nothing else required. We appreciate the enthusiasm.",
    link: { href: "/", label: "Read the latest issue →" },
  },
  invalid_email: { title: "That address doesn't look quite right.", body: "Check it and try again. Even email needs correct coordinates." },
  name_required: { title: "We'd like to know what to call you.", body: "Add your first name and try again." },
  domain_no_mail: { title: "We can't deliver there.", body: "That domain doesn't appear to accept email. Try another address." },
  rate_limited: { title: "Too many attempts.", body: "Give it a little while and try again. The internet has trust issues." },
  too_fast: { title: "Too many attempts.", body: "Give it a moment and try again. The internet has trust issues." },
  blocked: {
    title: "We couldn't subscribe this address.",
    body: contactEmail ? `If you think we've got that wrong, contact ${contactEmail}.` : "If you think we've got that wrong, get in touch.",
  },
})

const FALLBACK: Problem = { title: "Something went wrong.", body: "Please try again in a moment." }

/** `website` is the hidden honeypot field's value; `t` is when the form appeared (bots submit instantly). */
const subscribe = async (email: string, name: string, website: string, t: number): Promise<{ ok: boolean; error?: string }> => {
  if (!name) return { ok: false, error: "name_required" }
  if (!email || !email.includes("@") || !email.split("@")[1]?.includes(".")) return { ok: false, error: "invalid_email" }
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, website, t }),
    })
    if (res.ok) return { ok: true }
    const { error } = await res.json().catch(() => ({ error: "" }))
    return { ok: false, error: res.status === 409 ? "already_subscribed" : error }
  } catch {
    return { ok: false }
  }
}

const inputBase =
  "min-w-0 font-sans text-base px-3.5 py-3 rounded-none outline-none text-ink placeholder:text-meta focus:shadow-[0_0_0_2px_var(--color-accent)]"

const SubscribeForm = ({
  variant, nextMonth, editorName = "", editorShortBio = "", editorPhotoUrl = "", contactEmail = "", intro,
}: {
  variant: Variant
  /** The month of the next issue, e.g. "December". */
  nextMonth: string
  editorName?: string
  editorShortBio?: string
  editorPhotoUrl?: string
  contactEmail?: string
  /** Shown above the page form, hidden once subscribed. */
  intro?: React.ReactNode
}) => {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [problem, setProblem] = useState<Problem | null>(null)
  const [website, setWebsite] = useState("")
  const shownAt = useRef(0)
  useEffect(() => { shownAt.current = Date.now() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setProblem(null)
    const result = await subscribe(email.trim(), name.trim(), website, shownAt.current)
    if (result.ok) {
      setStatus("success")
      setEmail("")
      setName("")
    } else {
      setStatus("error")
      setProblem(PROBLEMS(contactEmail)[result.error || ""] || FALLBACK)
    }
  }

  const loading = status === "loading"
  const honeypot = (
    // Named so browser autofill never recognises it (a field called "website" got autofilled,
    // which made real readers look like bots).
    <input type="text" name="gb_hp_x7" id="gb_hp_x7" value={website} onChange={e => setWebsite(e.target.value)}
      tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore aria-hidden="true"
      className="absolute -left-[9999px] w-px h-px opacity-0" />
  )
  const problemText = (tone: string) => problem && (
    <div className={`font-sans text-[14px] leading-[1.5] ${tone}`} role="alert">
      <b>{problem.title}</b> {problem.body}
      {problem.link && <> <Link href={problem.link.href} className="underline underline-offset-2">{problem.link.label}</Link></>}
    </div>
  )

  if (variant === "page") {
    if (status === "success") {
      return (
        <div className="w-full max-w-[560px] text-center">
          <div className="w-14 h-14 mx-auto border-2 border-accent rounded-full flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-accent" />
          </div>
          <h1 className="mt-5 font-display font-bold text-[40px] sm:text-[56px] leading-none tracking-[-0.015em]">You&apos;re in.</h1>
          <p className="mt-4 mx-auto max-w-[440px] font-serif text-lg leading-[1.6] text-ink-2">
            Welcome to GeoBriefing. The next issue arrives on the <b className="text-ink">1st of {nextMonth}</b>.
            A welcome email is on its way now.
          </p>
          <div className="border-l-[3px] border-accent bg-accent-tint px-[18px] py-3.5 mt-7 mx-auto max-w-[440px] text-left font-sans text-[15px] leading-[1.55] text-ink-2">
            If you find it in Promotions or Spam, move it to your main inbox so future issues know where they live.
            Email algorithms are not known for their cartographic abilities.
          </div>
          <div className="flex flex-wrap justify-center gap-5 items-center mt-7">
            <Link href="/" className="font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper px-[22px] py-[15px] hover:bg-accent">
              Return to the front page →
            </Link>
          </div>
        </div>
      )
    }

    return (
      <>
      {intro}
      <form onSubmit={submit} noValidate className="relative border-t-2 border-ink mt-8 pt-6 flex flex-col gap-4">
        {honeypot}
        <label className="flex flex-col gap-1.5">
          <span className="font-sans font-semibold text-label tracking-nav uppercase">First name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="given-name" required
            className={`${inputBase} border border-ink bg-card`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans font-semibold text-label tracking-nav uppercase">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" autoComplete="email" required
            aria-invalid={status === "error"}
            className={`${inputBase} border bg-card ${status === "error" ? "border-danger" : "border-ink"}`} />
        </label>
        {problemText("text-danger")}
        <button type="submit" disabled={loading}
          className="font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper p-[17px] hover:bg-accent transition-colors disabled:opacity-60 cursor-pointer">
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
        <span className="font-sans text-[13px] leading-[1.5] text-meta text-center">
          No spam. No selling your address. No mysterious &ldquo;selected partners.&rdquo; Just the publication.
        </span>
        {editorName && (
          <div className="flex items-center justify-center gap-3 mt-3 pt-[18px] border-t border-hair">
            {editorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={editorPhotoUrl} alt="" className="flex-none w-10 h-10 rounded-full object-cover border border-hair-2" />
            ) : (
              <span className="flex-none w-10 h-10 rounded-full hatch border border-hair-2" />
            )}
            <span className="font-sans text-[15px] sm:text-sm leading-[1.45] text-ink-2 text-left">
              <b>Edited by {editorName}</b>
              {editorShortBio && <><br />{editorShortBio}</>}
            </span>
          </div>
        )}
      </form>
      </>
    )
  }

  if (status === "success") {
    return (
      <div className={variant === "band" ? "text-paper" : ""}>
        <div className="font-display font-bold text-2xl">You&apos;re in.</div>
        <p className={`mt-1.5 font-sans text-[15px] leading-[1.5] ${variant === "band" ? "text-[#CFCEC6]" : "text-ink-3"}`}>
          The next issue arrives on the 1st of {nextMonth}. A welcome email is on its way now.
        </p>
      </div>
    )
  }

  const band = variant === "band"
  const field = band
    ? "bg-[#FAFAF7] text-[#1A1A1A] border border-[#FAFAF7] py-[15px] px-4"
    : "bg-card border border-ink py-3.5 px-4"
  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-2.5">
      {honeypot}
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name"
        aria-label="First name" autoComplete="given-name" required className={`${inputBase} ${field}`} />
      <div className="flex flex-col sm:flex-row">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email"
          aria-label="Email address" autoComplete="email" required
          className={`${inputBase} flex-1 ${field} sm:border-r-0`} />
        <button type="submit" disabled={loading}
          className={`mt-2 sm:mt-0 font-sans font-semibold text-xs leading-none tracking-button uppercase px-[22px] py-4 sm:py-0 transition-colors disabled:opacity-60 cursor-pointer ${band
            ? "bg-[#1A6B3C] text-[#FAFAF7] border border-[#1A6B3C] hover:bg-[#134F2C]"
            : "bg-ink text-paper hover:bg-accent"}`}>
          {loading ? "…" : "Subscribe"}
        </button>
      </div>
      {problemText(band ? "text-[#E2735F]" : "text-danger")}
    </form>
  )
}

export default SubscribeForm
