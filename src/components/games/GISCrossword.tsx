"use client"
import { useState } from "react"

interface CrosswordClue {
  direction: "ACROSS" | "DOWN"
  number: number
  clue: string
  answer: string
  row: number
  col: number
}

interface CrosswordData {
  title: string
  clues: CrosswordClue[]
}

const GISCrossword = ({ data }: { data: CrosswordData }) => {
  const GRID_SIZE = 10
  const [grid, setGrid] = useState<string[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(""))
  )
  const [revealed, setRevealed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  )

  const clues = data?.clues || []

  const cellMap: Record<string, { answer: string; clueNum: number }> = {}
  const numberMap: Record<string, number> = {}

  clues.forEach(clue => {
    if (!clue.answer || clue.row === undefined || clue.col === undefined) return
    const key = `${clue.row}-${clue.col}`
    if (!numberMap[key]) numberMap[key] = clue.number

    for (let i = 0; i < clue.answer.length; i++) {
      const r = clue.direction === "ACROSS" ? clue.row : clue.row + i
      const c = clue.direction === "ACROSS" ? clue.col + i : clue.col
      if (r < GRID_SIZE && c < GRID_SIZE) {
        cellMap[`${r}-${c}`] = { answer: clue.answer[i], clueNum: clue.number }
      }
    }
  })

  const activeCells = new Set(Object.keys(cellMap))

  const handleInput = (r: number, c: number, val: string) => {
    if (revealed) return
    const newGrid = grid.map(row => [...row])
    newGrid[r][c] = val.toUpperCase().slice(-1)
    setGrid(newGrid)
    setChecked(false)
  }

  const handleCheck = () => {
    const newCorrect = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
    clues.forEach(clue => {
      if (!clue.answer) return
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.direction === "ACROSS" ? clue.row : clue.row + i
        const c = clue.direction === "ACROSS" ? clue.col + i : clue.col
        if (r < GRID_SIZE && c < GRID_SIZE) {
          newCorrect[r][c] = grid[r][c] === clue.answer[i]
        }
      }
    })
    setCorrect(newCorrect)
    setChecked(true)
  }

  const handleReveal = () => {
    const newGrid = grid.map(row => [...row])
    clues.forEach(clue => {
      if (!clue.answer) return
      for (let i = 0; i < clue.answer.length; i++) {
        const r = clue.direction === "ACROSS" ? clue.row : clue.row + i
        const c = clue.direction === "ACROSS" ? clue.col + i : clue.col
        if (r < GRID_SIZE && c < GRID_SIZE) {
          newGrid[r][c] = clue.answer[i]
        }
      }
    })
    setGrid(newGrid)
    setRevealed(true)
  }

  const acrossClues = clues.filter(c => c.direction === "ACROSS").sort((a, b) => a.number - b.number)
  const downClues = clues.filter(c => c.direction === "DOWN").sort((a, b) => a.number - b.number)

  return (
    <div className="border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="flex flex-col items-center lg:items-start">
          <div className="overflow-x-auto max-w-full">
            <div
              className="inline-grid border border-gray-400"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(24px, 28px))` }}
            >
              {Array(GRID_SIZE).fill(null).map((_, r) =>
                Array(GRID_SIZE).fill(null).map((__, c) => {
                  const key = `${r}-${c}`
                  const isActive = activeCells.has(key)
                  const num = numberMap[key]
                  const isCorrectCell = checked && correct[r][c]
                  const isWrongCell = checked && isActive && grid[r][c] && !correct[r][c]

                  return (
                    <div
                      key={key}
                      className="relative aspect-square"
                      style={{ width: "clamp(24px, 8vw, 28px)", height: "clamp(24px, 8vw, 28px)" }}
                    >
                      {isActive ? (
                        <>
                          {num && (
                            <span className="absolute top-0 left-0 text-[7px] font-bold text-gray-500 leading-none pl-0.5 pt-0.5 z-10">
                              {num}
                            </span>
                          )}
                          <input
                            type="text"
                            maxLength={1}
                            value={grid[r][c]}
                            onChange={e => handleInput(r, c, e.target.value)}
                            disabled={revealed}
                            className={`w-full h-full text-center text-xs font-bold border border-gray-300 outline-none uppercase
                              ${isCorrectCell ? "bg-green-100 text-green-800" :
                                isWrongCell ? "bg-red-100 text-red-800" :
                                "bg-white"}
                              focus:bg-yellow-50 focus:border-[#1a6b3c]`}
                            style={{ fontSize: 11, paddingTop: num ? 8 : 0 }}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#1a1a1a]" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCheck} disabled={revealed}
              className="text-xs font-sans font-bold tracking-widest uppercase px-3 py-1.5 border border-[#1a1a1a] hover:bg-gray-100 disabled:opacity-40">
              Check
            </button>
            <button onClick={handleReveal} disabled={revealed}
              className="text-xs font-sans font-bold tracking-widest uppercase px-3 py-1.5 bg-[#1a1a1a] text-white hover:bg-[#1a6b3c] disabled:opacity-40">
              Reveal
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6">
          {acrossClues.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-2">Across</p>
              {acrossClues.map(clue => (
                <div key={clue.number} className="flex gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-500 w-4 flex-shrink-0">{clue.number}.</span>
                  <span className="text-xs font-sans text-gray-700">{clue.clue}</span>
                </div>
              ))}
            </div>
          )}
          {downClues.length > 0 && (
            <div>
              <p className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-2">Down</p>
              {downClues.map(clue => (
                <div key={clue.number} className="flex gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-500 w-4 flex-shrink-0">{clue.number}.</span>
                  <span className="text-xs font-sans text-gray-700">{clue.clue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GISCrossword