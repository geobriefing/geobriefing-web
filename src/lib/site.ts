import { createHmac, createHash, timingSafeEqual } from "crypto"

/** Public site URL, used in emails. Set SITE_URL in the environment for production. */
export const siteUrl = () =>
  (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://read-geobriefing.vercel.app").replace(/\/$/, "")

/** Secret for signing links and hashing visitors. Falls back to the service key so it always exists server-side. */
const secret = () =>
  process.env.LINK_SIGNING_SECRET || process.env.CRON_SECRET ||
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || "geobriefing"

/** The site's host name for display, e.g. "read-geobriefing.vercel.app". */
export const siteHost = () => siteUrl().replace(/^https?:\/\//, "")

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url").slice(0, 32)

/** One-click unsubscribe link for an address. The signature stops anyone unsubscribing someone else. */
export const unsubscribeUrl = (email: string) => {
  const e = email.toLowerCase().trim()
  return `${siteUrl()}/api/unsubscribe?e=${encodeURIComponent(e)}&t=${sign(`unsub:${e}`)}`
}

export const verifyUnsubscribe = (email: string, token: string) => {
  const expected = Buffer.from(sign(`unsub:${email.toLowerCase().trim()}`))
  const given = Buffer.from(token || "")
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** sha256 with the server secret, for values that must never be stored in the clear. */
export const secretHash = (value: string) => createHash("sha256").update(`${secret()}:${value}`).digest("hex")
