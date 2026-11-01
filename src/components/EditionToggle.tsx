"use client"
import { useEffect, useState } from "react"

type Edition = "day" | "night"

const currentEdition = (): Edition => {
  const set = document.documentElement.dataset.edition
  if (set === "day" || set === "night") return set
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day"
}

/** Switches between the day and night editions and remembers the choice. */
const EditionToggle = () => {
  const [edition, setEdition] = useState<Edition | null>(null)

  useEffect(() => {
    // Read the edition the inline layout script (or the OS) already applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEdition(currentEdition())
  }, [])

  const toggle = () => {
    const next: Edition = currentEdition() === "night" ? "day" : "night"
    document.documentElement.dataset.edition = next
    try { localStorage.setItem("gb-edition", next) } catch {}
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach(m => { m.content = next === "night" ? "#131412" : "#FAFAF7" })
    setEdition(next)
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
