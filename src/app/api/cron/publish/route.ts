import { NextRequest, NextResponse } from "next/server"
import { isCron } from "@/lib/adminAuth"
import { runScheduler } from "@/lib/publish"

/**
 * Publish scheduler, called hourly (GitHub Actions publish.yml, or Vercel Cron).
 * Requires `Authorization: Bearer <CRON_SECRET>`.
 */
const handle = async (req: NextRequest) => {
  if (!isCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    return NextResponse.json(await runScheduler())
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

export const GET = handle
export const POST = handle
