import type { SiteSettings } from "@/lib/settings"

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
 * The next publish slot at or after `from`. GeoBriefing is monthly: it publishes on
 * the 1st of every month at the publish time, in the configured timezone. Changing
 * Settings moves every future slot; nothing is stored.
 */
export const nextPublishSlot = (from: Date, s: Pick<SiteSettings, "publishTime" | "timezone">): Date => {
  const [hh, mm] = s.publishTime.split(":").map(Number)
  const p = localParts(from, s.timezone)
  const thisMonth = zonedTimeToUtc(p.y, p.m, 1, hh, mm, s.timezone)
  if (thisMonth.getTime() >= from.getTime()) return thisMonth
  return p.m === 12
    ? zonedTimeToUtc(p.y + 1, 1, 1, hh, mm, s.timezone)
    : zonedTimeToUtc(p.y, p.m + 1, 1, hh, mm, s.timezone)
}

/** When the next issue comes out, for copy: "December" and "1 December 2026". */
export const nextIssueDate = (s: Pick<SiteSettings, "publishTime" | "timezone">, from = new Date()) => {
  const slot = nextPublishSlot(from, s)
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: s.timezone }).format(slot)
  return { slot, month: fmt({ month: "long" }), date: fmt({ day: "numeric", month: "long", year: "numeric" }) }
}

/** "№01" */
export const issueNo = (n: number) => `№${String(n).padStart(2, "0")}`
