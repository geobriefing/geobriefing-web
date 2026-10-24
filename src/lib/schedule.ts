import type { SiteSettings } from "@/lib/settings"

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

/** Minutes the timezone is ahead of UTC at a given instant, e.g. +300 for Asia/Karachi. */
const offsetMinutes = (at: Date, timeZone: string) => {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at).find(p => p.type === "timeZoneName")?.value || "GMT"
  const m = name.match(/GMT([+-])(\d{2}):?(\d{2})?/)
  if (!m) return 0
  const minutes = Number(m[2]) * 60 + Number(m[3] || 0)
  return m[1] === "-" ? -minutes : minutes
}

/** The UTC instant for a wall-clock time in a timezone. */
export const zonedTimeToUtc = (y: number, month: number, d: number, hh: number, mm: number, timeZone: string) => {
  const guess = Date.UTC(y, month - 1, d, hh, mm)
  let utc = guess - offsetMinutes(new Date(guess), timeZone) * 60_000
  // A second pass settles daylight-saving boundaries.
  utc = guess - offsetMinutes(new Date(utc), timeZone) * 60_000
  return new Date(utc)
}

/** Calendar parts of an instant as seen in a timezone. */
const localParts = (at: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "numeric", day: "numeric", weekday: "long",
  }).formatToParts(at)
  const get = (t: string) => parts.find(p => p.type === t)?.value || ""
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), weekday: get("weekday").toLowerCase() }
}

/**
 * The first publish slot (publish day + time in the configured timezone) at or after `from`.
 * Changing Settings moves every future slot; nothing is stored.
 */
export const nextPublishSlot = (from: Date, s: Pick<SiteSettings, "publishDayKey" | "publishTime" | "timezone">): Date => {
  const [hh, mm] = s.publishTime.split(":").map(Number)
  for (let i = 0; i <= 7; i++) {
    const day = new Date(from.getTime() + i * 86_400_000)
    const p = localParts(day, s.timezone)
    if (p.weekday !== s.publishDayKey) continue
    const slot = zonedTimeToUtc(p.y, p.m, p.d, hh, mm, s.timezone)
    if (slot.getTime() >= from.getTime()) return slot
  }
  // Same weekday but the time has passed: next week.
  return nextPublishSlot(new Date(from.getTime() + 86_400_000), s)
}

/** Monday 00:00 to the publish slot, in the configured timezone: the week an issue covers. */
export const weekCovered = (slot: Date, timeZone: string) => {
  const p = localParts(slot, timeZone)
  const back = (WEEKDAYS.indexOf(p.weekday) + 6) % 7
  const monday = localParts(new Date(slot.getTime() - back * 86_400_000), timeZone)
  return { start: zonedTimeToUtc(monday.y, monday.m, monday.d, 0, 0, timeZone), end: slot }
}
