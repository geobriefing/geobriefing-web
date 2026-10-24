"use client"
import { useState } from "react"
import { SectionLabel } from "@/components/Editorial"

interface SatelliteSpotData {
  image_url: string
  options: string[]
  use_embed: boolean
}

type Pick = { option: string; correct: boolean }

const KEYS = "ABCDEFGH"

/** The answer is not in the page: each pick is checked (and anonymously counted) by /api/games/play. */
const SatelliteSpot = ({ data, gameId, publishDay }: { data: SatelliteSpotData; gameId: string; publishDay: string }) => {
  const [picks, setPicks] = useState<Pick[]>([])
  const [fact, setFact] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const solved = picks.some(p => p.correct)
  // Stable order on server and client; the answer's position is not meaningful.
  const options = [...(data.options || [])].sort((a, b) => a.localeCompare(b))
  const last = picks[picks.length - 1]

  const pick = async (option: string) => {
    if (solved || busy || picks.some(p => p.option === option)) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, choice: option }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Could not check that answer")
      setPicks(p => [...p, { option, correct: !!json.isCorrect }])
      if (json.isCorrect) setFact((json.reveal?.fact as string) || null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div className="aspect-square bg-paper-2 border border-hair overflow-hidden">
        {!data.image_url ? (
          <div className="w-full h-full hatch flex items-end p-3">
            <span className="font-mono text-[11px] text-meta">Satellite image pending</span>
          </div>
        ) : data.use_embed ? (
          <iframe src={data.image_url} className="w-full h-full border-0" title="Satellite view" loading="lazy" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img loading="lazy" src={data.image_url} alt="Satellite view of the place to identify" className="w-full h-full object-cover" />
        )}
      </div>
      <div>
        <SectionLabel className="mb-3">Satellite Spot</SectionLabel>
        <h3 className="font-display font-semibold text-xl sm:text-[22px] leading-[1.25] mb-4">Where on Earth is this?</h3>
        <div className="flex flex-col gap-2">
          {options.map((option, i) => {
            const p = picks.find(x => x.option === option)
            const right = p?.correct
            const wrong = p && !p.correct
            return (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                disabled={solved || busy}
                className={`flex items-center gap-3 text-left px-3.5 py-3 border font-sans text-base text-ink transition-colors ${
                  right ? "bg-accent-tint border-accent" :
                  wrong ? "bg-danger-tint border-danger" :
                  "bg-card border-hair-2 hover:border-ink"
                } ${solved ? "cursor-default" : "cursor-pointer"}`}
              >
                <span className={`flex-none w-6 h-6 flex items-center justify-center border font-mono font-semibold text-xs ${
                  right ? "bg-accent border-accent text-paper" :
                  wrong ? "bg-danger border-danger text-paper" :
                  "bg-paper border-hair-2"
                }`}>{KEYS[i]}</span>
                <span className="flex-1">{option}</span>
                {right && <span className="font-sans font-semibold text-label tracking-meta uppercase text-accent">Correct</span>}
                {wrong && <span className="font-sans font-semibold text-label tracking-meta uppercase text-danger">Not this one</span>}
              </button>
            )
          })}
        </div>
        <p className="mt-3 font-sans text-[15px] sm:text-sm leading-[1.5] text-ink-3 min-h-[21px]" aria-live="polite">
          {error || (solved ? fact || "Correct." : last ? "Not quite. Try another." : "")}
        </p>
        <div className="font-sans font-medium text-caption tracking-[.1em] uppercase text-meta mt-1">
          Full answer in next {publishDay}&apos;s issue
        </div>
      </div>
    </div>
  )
}

export default SatelliteSpot
