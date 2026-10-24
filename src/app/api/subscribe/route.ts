import { NextRequest, NextResponse, after } from "next/server"
import { promises as dns } from "dns"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { secretHash } from "@/lib/site"
import { drainQueue, enqueueWelcome } from "@/lib/emailQueue"

const SIGNUPS_PER_VISITOR_PER_DAY = 5
const MIN_FILL_MS = 1500

/** Names are display-only: no markup, no control characters, 80 characters at most. */
const cleanName = (raw: unknown) =>
  String(raw ?? "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f<>"`]/g, "").replace(/\s+/g, " ").trim().slice(0, 80)

/**
 * True unless the domain definitely can't receive mail (no MX and no A record).
 * A slow or failing DNS lookup lets the address through rather than turning a reader away.
 */
const domainTakesMail = async (domain: string) => {
  const lookup = async () => {
    try {
      if ((await dns.resolveMx(domain)).length) return true
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code
      if (code !== "ENOTFOUND" && code !== "ENODATA") return true
    }
    try {
      return (await dns.resolve4(domain)).length > 0
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code
      return code !== "ENOTFOUND" && code !== "ENODATA"
    }
  }
  return Promise.race([lookup(), new Promise<boolean>(r => setTimeout(() => r(true), 3000))])
}

/**
 * Signup. Spam checks, in order: a hidden "website" field only bots fill in, a
 * minimum time between the form appearing and being sent, five signups per visitor
 * per day (visitor = hashed IP + date, never stored in the clear), and a DNS check
 * that the email's domain accepts mail. The welcome email is queued and sent
 * straight after the response, within the daily allowance.
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || "").toLowerCase().trim()
    const name = cleanName(body.name)

    // Bots get a normal-looking success and nothing is stored.
    if (body.website) return NextResponse.json({ success: true })
    const startedAt = Number(body.t)
    if (!startedAt || Date.now() - startedAt < MIN_FILL_MS) {
      return NextResponse.json({ error: "too_fast" }, { status: 400 })
    }

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 })
    }

    const db = supabaseAdmin()
    const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown").trim()
    const signupHash = secretHash(`signup:${ip}:${new Date().toISOString().slice(0, 10)}`)
    const { count } = await db.from("subscribers").select("id", { count: "exact", head: true }).eq("signup_hash", signupHash)
    if ((count || 0) >= SIGNUPS_PER_VISITOR_PER_DAY) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 })
    }

    if (!(await domainTakesMail(email.split("@")[1]))) {
      return NextResponse.json({ error: "domain_no_mail" }, { status: 400 })
    }

    const { data: existing } = await db.from("subscribers").select("id, status").eq("email", email).maybeSingle()
    if (existing?.status === "active") {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }
    // An address that bounced or marked us as spam stays off the list.
    if (existing && existing.status !== "unsubscribed") {
      return NextResponse.json({ error: "blocked" }, { status: 400 })
    }

    const fields = { status: "active", signup_hash: signupHash, status_changed_at: new Date().toISOString(), ...(name ? { name } : {}) }
    // A reader who unsubscribed and comes back is reactivated rather than refused.
    const { data: sub, error: dbError } = existing
      ? await db.from("subscribers").update(fields).eq("id", existing.id).select("id, email").single()
      : await db.from("subscribers").insert({ email, confirmed: false, ...fields }).select("id, email").single()
    if (dbError) throw dbError

    await enqueueWelcome(sub)
    after(() => drainQueue({ kinds: ["welcome"], max: 10 }).catch(e => console.error("Welcome send failed:", e)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
