"use client"
import { useState } from "react"
import { SectionLabel } from "@/components/Editorial"

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

const GRID_SIZE = 10

const ClueList = ({ title, list }: { title: string; list: CrosswordClue[] }) => (
  <div>
    <div className="font-sans font-bold text-xs tracking-button uppercase pb-2 border-b border-ink mb-2">{title}</div>
    {list.map(clue => (
      <div key={`${title}-${clue.number}`} className="flex gap-2.5 py-[5px] font-sans text-[15px] leading-[1.45] text-ink-2">
        <b className="w-[18px] flex-none">{clue.number}</b>
        <span>{clue.clue} <span className="text-meta">({clue.answer.length})</span></span>
      </div>
    ))}
  </div>
)

const GISCrossword = ({ data }: { data: CrosswordData }) => {
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

  // Draw only the rows and columns the puzzle uses.
  const used = [...activeCells].map(k => k.split("-").map(Number))
  const rows = used.length ? Math.max(...used.map(([r]) => r)) + 1 : GRID_SIZE
  const cols = used.length ? Math.max(...used.map(([, c]) => c)) + 1 : GRID_SIZE

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
    <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)] gap-6 lg:gap-9">
      <div>
        <SectionLabel className="mb-3.5">GIS Crossword</SectionLabel>
        <div className="overflow-x-auto max-w-full">
          <div className="inline-grid border-2 border-ink" style={{ gridTemplateColumns: `repeat(${cols}, clamp(28px, 8.2vw, 38px))` }}>
            {Array(rows).fill(null).map((_, r) =>
              Array(cols).fill(null).map((__, c) => {
                const key = `${r}-${c}`
                const isActive = activeCells.has(key)
                const num = numberMap[key]
                const isCorrectCell = checked && correct[r][c]
                const isWrongCell = checked && isActive && grid[r][c] && !correct[r][c]
                const borders = `${c < cols - 1 ? "border-r" : ""} ${r < rows - 1 ? "border-b" : ""} border-ink`

                return (
                  <div key={key} className={`relative aspect-square ${borders} ${isActive ? "" : "bg-ink"}`}>
                    {isActive && (
                      <>
                        {num && (
                          <span className="absolute left-[3px] top-0.5 font-sans font-semibold text-[9px] sm:text-[10px] leading-none z-10 text-ink-3">{num}</span>
                        )}
                        <input
                          type="text"
                          maxLength={1}
                          value={grid[r][c]}
                          onChange={e => handleInput(r, c, e.target.value)}
                          disabled={revealed}
                          aria-label={`Row ${r + 1}, column ${c + 1}`}
                          className={`w-full h-full text-center font-sans font-semibold text-sm sm:text-base uppercase outline-none rounded-none focus:bg-accent-tint ${
                            isCorrectCell ? "bg-accent-tint text-accent" :
                            isWrongCell ? "bg-danger-tint text-danger" :
                            "bg-card text-ink"
                          }`}
                          style={{ paddingTop: num ? 6 : 0 }}
                        />
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={handleCheck} disabled={revealed}
            className="min-h-11 sm:min-h-0 font-sans font-semibold text-label leading-none tracking-nav uppercase px-3.5 py-2.5 border border-ink text-ink hover:border-accent hover:text-accent disabled:opacity-40 cursor-pointer">
            Check
          </button>
          <button type="button" onClick={handleReveal} disabled={revealed}
            className="min-h-11 sm:min-h-0 font-sans font-semibold text-label leading-none tracking-nav uppercase px-3.5 py-2.5 bg-ink text-paper hover:bg-accent disabled:opacity-40 cursor-pointer">
            Reveal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:pt-[26px]">
        {acrossClues.length > 0 && <ClueList title="Across" list={acrossClues} />}
        {downClues.length > 0 && <ClueList title="Down" list={downClues} />}
      </div>
    </div>
  )
}

export default GISCrossword
