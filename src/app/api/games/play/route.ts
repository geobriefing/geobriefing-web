import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { scorePlay, type GameRow } from "@/lib/games"
import { secretHash } from "@/lib/site"

// Upper bound on counted plays per visitor per day, across all games.
const DAILY_LIMIT = 30

/**
 * Records one anonymous play and returns the result.
 * Body: { gameId, choice } where choice is an option (Satellite Spot), {lat, lng}
 * (GeoGuesser) or {cells: {"r-c": "A"}} (crossword).
 * Stores no IP or user id: only sha256(secret + ip + date), which allows one counted
 * play per game per visitor per day. Repeat attempts are scored but not recorded.
 */
export const POST = async (req: NextRequest) => {
  let body: { gameId?: string; choice?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }
  if (!body.gameId || body.choice === undefined) return NextResponse.json({ error: "gameId and choice are required" }, { status: 400 })

  const db = supabaseAdmin()
  const { data: game } = await db.from("games").select("*, issues!inner(status)").eq("id", body.gameId).eq("status", "approved").maybeSingle()
  if (!game || (game as { issues: { status: string } }).issues.status !== "published") {
    return NextResponse.json({ error: "Game not found" }, { status: 404 })
  }

  const result = scorePlay(game as GameRow, body.choice)
  if (!result) return NextResponse.json({ error: "Invalid choice for this game" }, { status: 400 })

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown"
  const day = new Date().toISOString().slice(0, 10)
  const dayHash = secretHash(`${ip}:${day}`)

  let recorded = false
  const { count } = await db.from("game_plays").select("id", { count: "exact", head: true })
    .eq("day_hash", dayHash).gte("created_at", `${day}T00:00:00Z`)
  if ((count || 0) < DAILY_LIMIT) {
    const { error } = await db.from("game_plays").insert({
      game_id: game.id,
      game_type: game.game_type,
      issue_id: game.issue_id,
      choice: body.choice,
      is_correct: result.isCorrect,
      distance_km: result.distanceKm,
      day_hash: dayHash,
    })
    // 23505: already played this game today; the first attempt is the one that counts.
    recorded = !error
    if (error && error.code !== "23505") console.error("game_plays insert failed:", error.message)
  }

  return NextResponse.json({ ...result, recorded })
}
