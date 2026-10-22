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
    setEdition(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="min-h-11 sm:min-h-0 font-sans font-medium text-[10.5px] leading-[1.4] tracking-meta uppercase text-meta hover:text-accent cursor-pointer"
    >
      {edition === "night" ? "Day edition" : edition === "day" ? "Night edition" : "Edition"}
    </button>
  )
}

export default EditionToggle
