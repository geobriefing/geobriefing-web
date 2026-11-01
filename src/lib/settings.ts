import { supabase } from "@/lib/supabase"

export interface SiteSettings {
  editorName: string
  editorBio: string
  /** One line, e.g. under "Edited by" on the subscribe page. */
  editorShortBio: string
  editorMission: string
  editorContact: string
  editorPhotoUrl: string
  /** "HH:MM" in `timezone`, on the 1st of every month. */
  publishTime: string
  timezone: string
  fromAddress: string
}

const DEFAULTS = {
  publishTime: "15:00",
  timezone: "Asia/Karachi",
  fromAddress: "GeoBriefing <onboarding@resend.dev>",
}

/** Builds settings from key/value rows. Unknown or missing keys fall back to defaults. */
export const settingsFromRows = (rows: { id: string; value: string }[]): SiteSettings => {
  const s: Record<string, string> = {}
  rows.forEach(r => { s[r.id] = r.value })
  const time = /^\d{1,2}:\d{2}$/.test(s["publish_time"] || "") ? s["publish_time"] : DEFAULTS.publishTime
  return {
    editorName: s["editor_name"] || "",
    editorBio: s["editor_bio"] || "",
    editorShortBio: s["editor_short_bio"] || "",
    editorMission: s["editor_mission"] || "",
    editorContact: s["editor_contact"] || "",
    editorPhotoUrl: s["editor_photo_url"] || "",
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

