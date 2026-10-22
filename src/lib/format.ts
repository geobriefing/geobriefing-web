const TZ = "Asia/Karachi"

type DateStyle = "long" | "short" | "weekday" | "dayMonth" | "monthYear"

const OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: { day: "numeric", month: "long", year: "numeric" },
  short: { day: "numeric", month: "short", year: "numeric" },
  weekday: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  monthYear: { month: "long", year: "numeric" },
}

/** Formats a timestamp in Asia/Karachi, e.g. "18 October 2026" or "Sunday 18 October 2026". */
export const formatDate = (value: string | null | undefined, style: DateStyle = "long") => {
  if (!value) return ""
  return new Intl.DateTimeFormat("en-GB", { ...OPTIONS[style], timeZone: TZ })
    .format(new Date(value))
    .replace(",", "")
    .replace(/\bSept\b/, "Sep")
}

/** Month abbreviation and day number for event date blocks. Dates without a time are treated as calendar dates. */
export const dateParts = (value: string) => {
  const d = new Date(value.length <= 10 ? `${value}T12:00:00Z` : value)
  return {
    mon: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: TZ }).format(d).slice(0, 3).toUpperCase(),
    day: new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: TZ }).format(d),
  }
}

const WORDS_PER_MINUTE = 230

/** Estimated read time in whole minutes for a set of text fields. */
export const readTime = (texts: (string | null | undefined)[]) => {
  const words = texts.reduce((n, t) => n + (t ? t.trim().split(/\s+/).length : 0), 0)
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export const pad2 = (n: number) => String(n).padStart(2, "0")

/** Splits long-form text into paragraphs on blank lines. */
export const paragraphs = (text: string | null | undefined) =>
  (text || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
