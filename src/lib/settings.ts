import { supabase } from "@/lib/supabase"

export interface SiteSettings {
  editorName: string
  editorBio: string
  editorMission: string
  editorContact: string
  editorPhotoUrl: string
  /** Publish day shown in all "Every Sunday" copy. */
  publishDay: string
  /** Publish time, Asia/Karachi. */
  publishTime: string
}

const DEFAULTS: SiteSettings = {
  editorName: "",
  editorBio: "",
  editorMission: "",
  editorContact: "",
  editorPhotoUrl: "",
  publishDay: "Sunday",
  publishTime: "15:00",
}

/** Reads the key/value site_settings table. Missing keys fall back to defaults. */
export const getSettings = async (): Promise<SiteSettings> => {
  const { data } = await supabase.from("site_settings").select("id, value")
  const s: Record<string, string> = {}
  ;(data || []).forEach((row: { id: string; value: string }) => { s[row.id] = row.value })
  return {
    editorName: s["editor_name"] || DEFAULTS.editorName,
    editorBio: s["editor_bio"] || DEFAULTS.editorBio,
    editorMission: s["editor_mission"] || DEFAULTS.editorMission,
    editorContact: s["editor_contact"] || DEFAULTS.editorContact,
    editorPhotoUrl: s["editor_photo_url"] || DEFAULTS.editorPhotoUrl,
    publishDay: s["publish_day"] || DEFAULTS.publishDay,
    publishTime: s["publish_time"] || DEFAULTS.publishTime,
  }
}
