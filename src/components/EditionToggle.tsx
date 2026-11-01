"use client"
import { useEffect, useState } from "react"

type Edition = "day" | "night"

const currentEdition = (): Edition => {
  const set = document.documentElement.dataset.edition
  if (set === "day" || set === "night") return set
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day"
}

/**
 * Switches between the day and night editions and remembers the choice.
 * "masthead" is the small sun/moon switch at the top of every page; "footer" is the text link.
 */
const EditionToggle = ({ variant = "footer" }: { variant?: "masthead" | "footer" }) => {
  const [edition, setEdition] = useState<Edition | null>(null)

  useEffect(() => {
    // Read the edition the inline layout script (or the OS) already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdition(currentEdition())
    // The masthead and footer switches stay in step.
    const sync = () => setEdition(currentEdition())
    window.addEventListener("gb-edition", sync)
    return () => window.removeEventListener("gb-edition", sync)
  }, [])

  const toggle = () => {
    const next: Edition = currentEdition() === "night" ? "day" : "night"
    document.documentElement.dataset.edition = next
    try { localStorage.setItem("gb-edition", next) } catch {}
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach(m => { m.content = next === "night" ? "#131412" : "#FAFAF7" })
    setEdition(next)
    window.dispatchEvent(new Event("gb-edition"))
  }

  if (variant === "masthead") {
    const night = edition === "night"
    const label = night ? "Switch to day edition" : "Switch to night edition"
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className="flex-none inline-flex items-center gap-1.5 min-h-9 px-2.5 -mr-2.5 font-sans font-semibold text-[11px] sm:text-label leading-none tracking-nav uppercase text-ink hover:text-accent cursor-pointer"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          {night ? (
            <>
              <circle cx="12" cy="12" r="4.5" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
            </>
          ) : (
            <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
          )}
        </svg>
        <span>{edition === null ? "Edition" : night ? "Day" : "Night"}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 sm:min-h-0 font-sans font-medium text-[11.5px] leading-[1.4] tracking-meta uppercase text-meta hover:text-accent cursor-pointer"
    >
      {edition === "night" ? "Switch to day edition" : edition === "day" ? "Switch to night edition" : "Day / night edition"}
    </button>
  )
}

export default EditionToggle
