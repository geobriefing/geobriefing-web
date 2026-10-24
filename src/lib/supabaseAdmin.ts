import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { fetchWithTimeout } from "@/lib/supabase"

/**
 * Service-role client. Server code only (route handlers, server components):
 * it bypasses row level security, so it must never be imported by a client component.
 */
let admin: SupabaseClient | null = null

export const supabaseAdmin = (): SupabaseClient => {
  if (typeof window !== "undefined") throw new Error("supabaseAdmin is server-only")
  if (!admin) {
    // Prefer SUPABASE_SERVICE_KEY; NEXT_PUBLIC_ names risk being shipped to the browser.
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY
    if (!key) throw new Error("SUPABASE_SERVICE_KEY is not set")
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithTimeout },
    })
  }
  return admin
}
