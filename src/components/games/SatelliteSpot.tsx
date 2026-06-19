"use client"
import { useState } from "react"

interface SatelliteSpotData {
  image_url: string
  answer: string
  options: string[]
  fact: string
  use_embed: boolean
  lat: number
  lon: number
}

export default function SatelliteSpot({ data }: { data: SatelliteSpotData }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)

  const handleGuess = (option: string) => {
    if (revealed) return
    setSelected(option)
    setRevealed(true)
  }

  // eslint-disable-next-line react-hooks/purity
  const shuffled = [...data.options].sort(() => Math.random() - 0.5)

  return (
    <div className="border border-gray-200">
      <div className="w-full h-56 sm:h-72 bg-gray-100 overflow-hidden">
        {data.use_embed ? (
          <iframe
            src={data.image_url}
            className="w-full h-full border-0"
            title="Satellite view"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image_url}
            alt="Satellite view - where is this?"
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-xs font-sans font-bold text-gray-500 uppercase tracking-widest mb-3">
          Where on Earth is this?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {shuffled.map((option) => {
            const isCorrect = option === data.answer
            const isSelected = option === selected
            let bg = "bg-white border-gray-300 hover:border-[#1a6b3c]"
            if (revealed && isCorrect) bg = "bg-green-50 border-green-500"
            else if (revealed && isSelected && !isCorrect) bg = "bg-red-50 border-red-400"
            return (
              <button
                key={option}
                onClick={() => handleGuess(option)}
                disabled={revealed}
                className={`border px-3 py-2 text-xs font-sans text-left transition-colors ${bg} ${!revealed ? "cursor-pointer" : "cursor-default"}`}
              >
                {option}
              </button>
            )
          })}
        </div>
        {revealed && (
          <div className={`px-4 py-3 text-sm font-sans border ${selected === data.answer ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800"}`}>
            {selected === data.answer ? "Correct!" : `The answer was ${data.answer}.`}
            <p className="text-xs text-gray-600 mt-1 font-normal">{data.fact}</p>
          </div>
        )}
      </div>
    </div>
  )
}