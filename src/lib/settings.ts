import { supabase } from "@/lib/supabase"

export interface SiteSettings {
  editorName: string
  editorBio: string
  editorMission: string
  editorContact: string
  editorPhotoUrl: string
  /** Display form, e.g. "Sunday". Used in all "Every Sunday" copy. */
  publishDay: string
  /** Stored form, e.g. "sunday". Used by the scheduler. */
  publishDayKey: string
  /** "HH:MM" in `timezone`. */
  publishTime: string
  timezone: string
  fromAddress: string
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const DEFAULTS = {
  publishDay: "sunday",
  publishTime: "15:00",
  timezone: "Asia/Karachi",
  fromAddress: "GeoBriefing <onboarding@resend.dev>",
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Builds settings from key/value rows. Unknown or missing keys fall back to defaults. */
export const settingsFromRows = (rows: { id: string; value: string }[]): SiteSettings => {
  const s: Record<string, string> = {}
  rows.forEach(r => { s[r.id] = r.value })
  const day = (s["publish_day"] || DEFAULTS.publishDay).toLowerCase()
  const publishDayKey = DAYS.includes(day) ? day : DEFAULTS.publishDay
  const time = /^\d{1,2}:\d{2}$/.test(s["publish_time"] || "") ? s["publish_time"] : DEFAULTS.publishTime
  return {
    editorName: s["editor_name"] || "",
    editorBio: s["editor_bio"] || "",
    editorMission: s["editor_mission"] || "",
    editorContact: s["editor_contact"] || "",
    editorPhotoUrl: s["editor_photo_url"] || "",
    publishDay: capitalise(publishDayKey),
    publishDayKey,
    publishTime: time,
    timezone: s["timezone"] || DEFAULTS.timezone,
    fromAddress: s["from_address"] || DEFAULTS.fromAddress,
  }
}

/** Reads the key/value site_settings table: the single source for schedule and editor identity. */
export const getSettings = async (): Promise<SiteSettings> => {
  const { data } = await supabase.from("site_settings").select("id, value")
  return settingsFromRows(data || [])
}

export const PUBLISH_DAYS = DAYS
