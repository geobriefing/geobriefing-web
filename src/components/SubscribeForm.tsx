"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"

type Variant = "band" | "inline" | "page"
type Status = "idle" | "loading" | "success" | "error"

const ERRORS: Record<string, string> = {
  too_fast: "That was quick. Please try again.",
  invalid_email: "That address looks incomplete.",
  domain_no_mail: "That email domain doesn't accept mail. Check the spelling?",
  rate_limited: "Too many signups from here today. Try again tomorrow.",
  blocked: "We can't send to that address. Try another one.",
}

/** `website` is the hidden honeypot; `t` is when the form appeared (bots submit instantly). */
const subscribe = async (email: string, name: string, website: string, t: number): Promise<{ ok: boolean; message?: string }> => {
  if (!email || !email.includes("@") || !email.split("@")[1]?.includes(".")) {
    return { ok: false, message: "That address looks incomplete." }
  }
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, website, t }),
    })
    if (res.status === 409) return { ok: false, message: "You are already subscribed." }
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }))
      return { ok: false, message: ERRORS[error] || "Something went wrong. Please try again." }
    }
    return { ok: true }
  } catch {
    return { ok: false, message: "Something went wrong. Please try again." }
  }
}

const inputBase =
  "min-w-0 font-sans text-base px-3.5 py-3 rounded-none outline-none text-ink placeholder:text-meta focus:shadow-[0_0_0_2px_var(--color-accent)]"

const SubscribeForm = ({
  variant, publishDay, editorName = "", editorPhotoUrl = "", intro,
}: {
  variant: Variant
  publishDay: string
  editorName?: string
  editorPhotoUrl?: string
  /** Shown above the page form, hidden once subscribed. */
  intro?: React.ReactNode
}) => {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  const [website, setWebsite] = useState("")
  const shownAt = useRef(0)
  useEffect(() => { shownAt.current = Date.now() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")
    const result = await subscribe(email.trim(), name.trim(), website, shownAt.current)
    if (result.ok) {
      setStatus("success")
      setEmail("")
      setName("")
    } else {
      setStatus("error")
      setMessage(result.message || "")
    }
  }

  const loading = status === "loading"

  if (variant === "page") {
    if (status === "success") {
      return (
        <div className="w-full max-w-[560px] text-center">
          <div className="w-14 h-14 mx-auto border-2 border-accent rounded-full flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-accent" />
          </div>
          <h1 className="mt-5 font-display font-bold text-[40px] sm:text-[56px] leading-none tracking-[-0.015em]">You are in.</h1>
          <p className="mt-4 mx-auto max-w-[440px] font-serif text-lg leading-[1.6] text-ink-2">
            Your first issue arrives on {publishDay} afternoon. Until then, this week&apos;s issue is already up, and so
            is this week&apos;s puzzle.
          </p>
          <div className="border-l-[3px] border-accent bg-accent-tint px-[18px] py-3.5 mt-7 mx-auto max-w-[440px] text-left font-sans text-[15px] leading-[1.55] text-ink-2">
            If it doesn&apos;t arrive, check your Promotions folder and drag it to your inbox.
          </div>
          <div className="flex flex-wrap justify-center gap-5 items-center mt-7">
            <Link href="/" className="font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper px-[22px] py-[15px] hover:bg-accent">
              Read this week&apos;s issue →
            </Link>
            <Link href="/issues" className="font-sans font-semibold text-xs leading-none tracking-nav uppercase text-accent border-b border-accent pb-[3px]">
              Browse the archive
            </Link>
          </div>
        </div>
      )
    }

    return (
      <>
      {intro}
      <form onSubmit={submit} noValidate className="relative border-t-2 border-ink mt-8 pt-6 flex flex-col gap-4">
        <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
        <label className="flex flex-col gap-1.5">
          <span className="font-sans font-semibold text-label tracking-nav uppercase">
            Name <span className="text-meta font-medium">(optional)</span>
          </span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Sana" autoComplete="given-name"
            className={`${inputBase} border border-ink bg-card`} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans font-semibold text-label tracking-nav uppercase">Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
            aria-invalid={status === "error"}
            className={`${inputBase} border bg-card ${status === "error" ? "border-danger" : "border-ink"}`} />
          {status === "error" && message && <span className="font-sans text-[13px] text-danger">{message}</span>}
        </label>
        <button type="submit" disabled={loading}
          className="font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper p-[17px] hover:bg-accent transition-colors disabled:opacity-60 cursor-pointer">
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
        <span className="font-sans text-[13px] leading-[1.5] text-meta text-center">
          We only use your email to send GeoBriefing. Never shared.
        </span>
        {editorName && (
          <div className="flex items-center justify-center gap-3 mt-3 pt-[18px] border-t border-hair">
            {editorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={editorPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-hair-2" />
            ) : (
              <span className="w-10 h-10 rounded-full hatch border border-hair-2" />
            )}
            <span className="font-sans text-[15px] sm:text-sm leading-[1.45] text-ink-2 text-left">
              <b>Written by {editorName}.</b><br />Every issue is read and edited by a person.
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
        <div className="font-display font-bold text-2xl">You are in.</div>
        <p className={`mt-1.5 font-sans text-[15px] leading-[1.5] ${variant === "band" ? "text-[#CFCEC6]" : "text-ink-3"}`}>
          Your first issue arrives on {publishDay} afternoon.
        </p>
      </div>
    )
  }

  const band = variant === "band"
  return (
    <form onSubmit={submit} noValidate className="relative flex flex-col gap-2.5">
      <input type="text" name="website" value={website} onChange={e => setWebsite(e.target.value)}
        tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
      <div className="flex flex-col sm:flex-row">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          aria-label="Email address" autoComplete="email"
          className={`${inputBase} flex-1 ${band
            ? "bg-[#FAFAF7] text-[#1A1A1A] border border-[#FAFAF7] sm:border-r-0 py-[15px] px-4"
            : "bg-card border border-ink sm:border-r-0 py-3.5 px-4"}`} />
        <button type="submit" disabled={loading}
          className={`mt-2 sm:mt-0 font-sans font-semibold text-xs leading-none tracking-button uppercase px-[22px] py-4 sm:py-0 transition-colors disabled:opacity-60 cursor-pointer ${band
            ? "bg-[#1A6B3C] text-[#FAFAF7] border border-[#1A6B3C] hover:bg-[#134F2C]"
            : "bg-ink text-paper hover:bg-accent"}`}>
          {loading ? "…" : "Subscribe"}
        </button>
      </div>
      {status === "error" && message && (
        <span className={`font-sans text-[13px] ${band ? "text-[#E2735F]" : "text-danger"}`}>{message}</span>
      )}
    </form>
  )
}

export default SubscribeForm
