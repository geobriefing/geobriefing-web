/** Game answers, scoring and the public (answer-free) game payloads. */

export type GameType = "satellite_spot" | "geoguesser" | "crossword"

export interface GameRow {
  id: string
  issue_id: string
  game_type: GameType
  data: Record<string, unknown>
  correct_option: string | null
  answer_lat: number | null
  answer_lng: number | null
  solution_grid: unknown
}

export interface CrosswordClue {
  direction: "ACROSS" | "DOWN"
  number: number
  clue: string
  answer: string
  row: number
  col: number
}

export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Satellite Spot answer: the dedicated column, falling back to the original data payload. */
export const satelliteAnswer = (g: GameRow) => g.correct_option ?? (g.data?.answer as string | undefined) ?? null

export const geoguesserAnswer = (g: GameRow) => {
  const lat = g.answer_lat ?? (g.data?.lat as number | undefined)
  const lng = g.answer_lng ?? (g.data?.lon as number | undefined)
  return lat == null || lng == null ? null : { lat, lng, name: (g.data?.name as string) || "" }
}

/** Solved crossword as a map of "row-col" -> letter. */
export const crosswordSolution = (g: GameRow): Record<string, string> => {
  const cells: Record<string, string> = {}
  const grid = g.solution_grid
  if (Array.isArray(grid) && Array.isArray(grid[0])) {
    (grid as string[][]).forEach((row, r) => row.forEach((letter, c) => { if (letter) cells[`${r}-${c}`] = letter }))
    return cells
  }
  const clues = (Array.isArray(grid) ? grid : (g.data?.clues as unknown[]) || []) as CrosswordClue[]
  clues.forEach(clue => {
    const answer = String(clue.answer || "").toUpperCase()
    for (let i = 0; i < answer.length; i++) {
      const r = clue.direction === "ACROSS" ? clue.row : clue.row + i
      const c = clue.direction === "ACROSS" ? clue.col + i : clue.col
      cells[`${r}-${c}`] = answer[i]
    }
  })
  return cells
}

/**
 * Data sent to the browser. Satellite Spot loses its answer and fact (the play API
 * returns them), GeoGuesser loses its coordinates and place name.
 * The crossword keeps its answers: the grid is checked in the browser.
 */
export const publicGameData = (g: GameRow): Record<string, unknown> => {
  const data = { ...(g.data || {}) }
  if (g.game_type === "satellite_spot") {
    delete data.answer
    delete data.fact
    if (!data.use_embed) {
      delete data.lat
      delete data.lon
      // Served through /api/games/[id]/image: the imagery URL's bounding box would reveal the answer.
      if (data.image_url) data.image_url = `/api/games/${g.id}/image`
    }
  }
  if (g.game_type === "geoguesser") {
    delete data.lat
    delete data.lon
    delete data.name
  }
  return data
}

export interface PlayResult {
  isCorrect: boolean | null
  distanceKm: number | null
  reveal: Record<string, unknown>
}

/** Scores one play. `choice` is an option string, {lat, lng}, or {cells: {"r-c": "A"}}. */
export const scorePlay = (g: GameRow, choice: unknown): PlayResult | null => {
  if (g.game_type === "satellite_spot") {
    const answer = satelliteAnswer(g)
    if (typeof choice !== "string" || !answer) return null
    const isCorrect = choice === answer
    return { isCorrect, distanceKm: null, reveal: isCorrect ? { fact: g.data?.fact ?? null } : {} }
  }
  if (g.game_type === "geoguesser") {
    const answer = geoguesserAnswer(g)
    const c = choice as { lat?: number; lng?: number }
    if (!answer || typeof c?.lat !== "number" || typeof c?.lng !== "number") return null
    const distanceKm = Math.round(haversineKm(c.lat, c.lng, answer.lat, answer.lng) * 10) / 10
    return { isCorrect: distanceKm < 100, distanceKm, reveal: { answer } }
  }
  if (g.game_type === "crossword") {
    const cells = (choice as { cells?: Record<string, string> })?.cells
    if (!cells || typeof cells !== "object") return null
    const solution = crosswordSolution(g)
    const isCorrect = Object.entries(solution).every(([k, v]) => (cells[k] || "").toUpperCase() === v)
    return { isCorrect, distanceKm: null, reveal: {} }
  }
  return null
}
