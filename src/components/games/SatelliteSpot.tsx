"use client"
import { useState } from "react"
import { SectionLabel } from "@/components/Editorial"

interface SatelliteSpotData {
  image_url: string
  answer: string
  options: string[]
  fact: string
  use_embed: boolean
  lat: number
  lon: number
}

const KEYS = "ABCDEFGH"

const SatelliteSpot = ({ data, publishDay }: { data: SatelliteSpotData; publishDay: string }) => {
  const [picked, setPicked] = useState<string[]>([])
  const solved = picked.includes(data.answer)
  // Stable order on server and client; the answer's position is not meaningful.
  const options = [...data.options].sort((a, b) => a.localeCompare(b))
  const last = picked[picked.length - 1]

  const pick = (option: string) => {
    if (solved || picked.includes(option)) return
    setPicked([...picked, option])
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div className="aspect-square bg-paper-2 border border-hair overflow-hidden">
        {!data.image_url ? (
          <div className="w-full h-full hatch flex items-end p-3">
            <span className="font-mono text-[11px] text-meta">Satellite image pending</span>
          </div>
        ) : data.use_embed ? (
          <iframe src={data.image_url} className="w-full h-full border-0" title="Satellite view" />
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
            const chosen = picked.includes(option)
            const right = chosen && option === data.answer
            const wrong = chosen && option !== data.answer
            return (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                disabled={solved}
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
          {solved ? data.fact : last ? "Not quite. Try another." : ""}
        </p>
        <div className="font-sans font-medium text-caption tracking-[.1em] uppercase text-meta mt-1">
          Full answer in next {publishDay}&apos;s issue
        </div>
      </div>
    </div>
  )
}

export default SatelliteSpot
