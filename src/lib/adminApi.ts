"use client"
import { supabase } from "@/lib/supabase"

/** Calls an /api/admin route with the signed-in editor's session token. */
export const adminFetch = async <T = unknown>(path: string, init: RequestInit = {}): Promise<T> => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
      Authorization: `Bearer ${token || ""}`,
    },
  })
  const isJson = res.headers.get("content-type")?.includes("application/json")
  const body = isJson ? await res.json() : await res.text()
  if (!res.ok) throw new Error((isJson && (body as { error?: string }).error) || `Request failed (${res.status})`)
  return body as T
}

export const adminPost = <T = unknown>(path: string, payload: unknown) =>
  adminFetch<T>(path, { method: "POST", body: JSON.stringify(payload) })
