import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

/**
 * Checks the editor's Supabase session token from `Authorization: Bearer <token>`.
 * Returns the user, or a 401 response to return as-is.
 */
export const requireEditor = async (req: Request) => {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) }
  const { data, error } = await supabaseAdmin().auth.getUser(token)
  if (error || !data.user) return { error: NextResponse.json({ error: "Session expired" }, { status: 401 }) }
  return { user: data.user }
}

/** Checks `Authorization: Bearer <CRON_SECRET>` for scheduled jobs. */
export const isCron = (req: Request) => {
  const secret = process.env.CRON_SECRET
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`
}
