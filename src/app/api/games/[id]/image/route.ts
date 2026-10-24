import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

/**
 * Satellite Spot image, served through the site so the browser never sees the
 * imagery URL (its bounding box would give away the answer's coordinates).
 */
export const GET = async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params
  const { data: game } = await supabaseAdmin().from("games").select("game_type, data").eq("id", id).maybeSingle()
  const source = game?.game_type === "satellite_spot" ? (game.data as { image_url?: string })?.image_url : null
  if (!source || !/^https:\/\//.test(source)) return NextResponse.json({ error: "Image not found" }, { status: 404 })

  const upstream = await fetch(source, { signal: AbortSignal.timeout(20_000) }).catch(() => null)
  if (!upstream?.ok) return NextResponse.json({ error: "Imagery service unavailable" }, { status: 502 })
  return new NextResponse(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") || "image/jpeg",
      // The picture for a game never changes, so browsers and the CDN can keep it.
      "cache-control": "public, max-age=604800, immutable",
    },
  })
}
