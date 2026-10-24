import { createClient } from '@supabase/supabase-js'

const TIMEOUT_MS = 4000

/**
 * fetch with a timeout, so an unreachable or paused database makes pages fall back to
 * their empty states quickly instead of hanging until the network gives up.
 */
export const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
  return fetch(input, { ...init, signal })
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: fetchWithTimeout } }
)
