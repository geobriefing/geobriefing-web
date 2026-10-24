"use client"
import { useCallback, useEffect, useState } from "react"
import AdminHeader from "@/components/AdminHeader"
import { RegionPill, TypePill } from "@/components/Pills"
import { AdminLoading, BigBtn, Btn, Chip, Notice, StatusText, softInputCls } from "@/components/AdminUI"
import { useAdminAuth } from "@/lib/useAdminAuth"
import { adminFetch, adminPost } from "@/lib/adminApi"
import { formatDate } from "@/lib/format"
import { DATASET_FORMATS, DESK_SECTIONS, REGIONS, SORTABLE, type DeskSection } from "@/lib/deskSections"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

interface DeskData {
  issues: Row[]
  issue: Row | null
  review: { section_name: string; reviewed: boolean; skipped: boolean }[]
  sections: Record<DeskSection, Row[]>
  hooks: {
    mustRead: { id: string; title: string } | null
    gamesTeaser: { lastAnswer: string | null; pctCorrect: number | null; plays: number; thisWeek: string } | null
    lastWeekPlays: number
    replyPrompt: string
    replyCount: number
    lastIssueReplyCount: number
  }
  schedule: { publishDay: string; publishTime: string; timezone: string; nextSlot: string }
}

const FEATURE_TYPES = ["Interview", "Concept Explainer", "Book & Paper Review", "App & Tool Review", "Opinion"]
const titleCls = `${softInputCls} font-display font-semibold text-h3 leading-[1.3]`
const bodyCls = `${softInputCls} font-sans text-base sm:text-[15px] leading-[1.55] text-ink-2 resize-y`
const smallCls = `${softInputCls} font-sans text-base sm:text-[15px]`

const slotLabel = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: tz })
    .format(new Date(iso)).replace(",", "")

/** What the editor typed but hasn't saved, per item id. */
type Edits = Record<string, Row>

const EditorsDeskPage = () => {
  const { ready, logout } = useAdminAuth()
  const [desk, setDesk] = useState<DeskData | null>(null)
  const [issueId, setIssueId] = useState<string | null>(null)
  const [active, setActive] = useState<DeskSection>("news")
  const [edits, setEdits] = useState<Edits>({})
  const [replyPrompt, setReplyPrompt] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (id: string | null) => {
    try {
      const data = await adminFetch<DeskData>(`/api/admin/desk${id ? `?issueId=${id}` : ""}`)
      setDesk(data)
      setReplyPrompt(data.hooks?.replyPrompt || "")
      setEdits({})
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`)
    }
  }, [])

  useEffect(() => {
    if (ready) load(issueId)
  }, [ready, issueId, load])

  if (!ready || !desk) return <AdminLoading />

  const issue = desk.issue
  const reviewOf = (key: string) => desk.review.find(r => r.section_name === key)
  const reviewedCount = DESK_SECTIONS.filter(s => reviewOf(s.key)?.reviewed).length
  const allReviewed = reviewedCount === DESK_SECTIONS.length
  const pct = Math.round((reviewedCount / DESK_SECTIONS.length) * 100)
  const def = DESK_SECTIONS.find(s => s.key === active)!
  const rows = desk.sections?.[active] || []
  const activeReview = reviewOf(active)

  const run = async (fn: () => Promise<unknown>, okMessage?: string) => {
    setBusy(true)
    setMessage("")
    try {
      await fn()
      if (okMessage) setMessage(okMessage)
      await load(issue?.id || null)
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const item = (table: string, action: string, id?: string, extra: Row = {}) =>
    run(() => adminPost("/api/admin/items", { table, action, id, issueId: issue?.id, ...extra }))
  const section = (action: string) =>
    run(() => adminPost("/api/admin/sections", { issueId: issue?.id, section: active, action }))
  const issueAction = (action: string, okMessage: string, patch?: Row) =>
    run(() => adminPost(`/api/admin/issues/${issue?.id}`, { action, patch }), okMessage)

  const edit = (id: string, patch: Row) => setEdits(e => ({ ...e, [id]: { ...e[id], ...patch } }))
  const val = (row: Row, field: string) => (edits[row.id]?.[field] ?? row[field] ?? "")
  const save = (row: Row) => {
    const patch = edits[row.id]
    if (!patch) return setMessage("No changes to save.")
    return item(def.table, "save", row.id, { patch })
  }
  const move = (index: number, dir: -1 | 1) => {
    const ids = rows.map(r => r.id)
    const j = index + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    item(def.table, "reorder", undefined, { ids })
  }
  const add = () => {
    const blank: Record<string, Row> = {
      country_desks: { country: "New country", region: "South Asia", intro: "", facts: [], follow: [] },
      datasets: { name: "New dataset", url: "https://", format: "Other", region: "Global" },
      events: { name: "New event", start_date: new Date().toISOString().slice(0, 10), url: "https://", event_type: "conference" },
    }
    item(def.table, "create", undefined, { patch: blank[def.table] || {} })
  }

  const statusChip = (key: DeskSection) => {
    const r = reviewOf(key)
    if (r?.skipped) return <Chip tone="skipped">Skipped</Chip>
    if (r?.reviewed) return <Chip tone="reviewed">Reviewed ✓</Chip>
    if (!(desk.sections?.[key] || []).length) return <Chip tone="empty">Empty</Chip>
    return <Chip tone="review">To review</Chip>
  }

  const published = issue?.status === "published"
  const scheduled = issue?.status === "scheduled"
  const tz = desk.schedule.timezone

  return (
    <div className="min-h-screen">
      <AdminHeader active="review" onLogout={logout} />
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">

        {!issue && (
          <div className="mt-8 border border-dashed border-[#B9B8B0] bg-card px-6 py-12 text-center">
            <div className="font-display font-bold text-[22px]">No issues yet</div>
            <p className="mt-2 font-sans text-[15px] text-ink-3">Run the weekly pipeline to create the first draft issue.</p>
          </div>
        )}

        {issue && (
          <>
            {/* Title row */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 py-5 border-b border-hair">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <h1 className="font-display font-bold text-[26px] leading-none">Editor&apos;s Desk</h1>
                <select value={issue.id} onChange={e => setIssueId(e.target.value)} aria-label="Issue"
                  className="w-full sm:w-auto font-sans text-base sm:text-sm px-2.5 py-2.5 sm:py-2 border border-hair-2 bg-card text-ink rounded-none outline-none focus:border-accent">
                  {desk.issues.map(i => (
                    <option key={i.id} value={i.id}>
                      Issue #{i.issue_number} · {i.status === "published" ? `published ${formatDate(i.published_at, "dayMonth")}` : i.status}
                    </option>
                  ))}
                </select>
                <span className="font-sans font-medium text-[13px] text-ink-3">
                  {published
                    ? `Published ${formatDate(issue.published_at, "short")}${issue.email_sent_at ? " · emailed" : " · not emailed"}`
                    : scheduled
                      ? `Scheduled · publishes ${slotLabel(desk.schedule.nextSlot, tz)} (${tz})`
                      : `${reviewedCount} of ${DESK_SECTIONS.length} sections ready · next slot ${slotLabel(desk.schedule.nextSlot, tz)}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {!published && (
                  <div className="w-[140px] h-1.5 bg-hair" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-1.5 bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <Btn disabled={busy} onClick={async () => {
                  try {
                    const html = await adminFetch<string>(`/api/admin/email-preview?slug=${encodeURIComponent(issue.slug)}`)
                    const w = window.open("", "_blank")
                    w?.document.write(html)
                    w?.document.close()
                  } catch (e) { setMessage(`Error: ${(e as Error).message}`) }
                }}>Preview email</Btn>
                <Btn disabled={busy} onClick={() => issueAction("test_email", "Test email sent to your contact address.")}>Send test</Btn>
                {!published && !scheduled && (
                  <button type="button" disabled={!allReviewed || busy}
                    onClick={() => issueAction("schedule", `Scheduled for ${desk.schedule.publishDay} ${desk.schedule.publishTime}.`)}
                    className={`min-h-11 sm:min-h-0 font-sans font-semibold text-xs leading-none tracking-button uppercase text-paper px-[18px] py-[13px] ${
                      allReviewed ? "bg-accent hover:bg-accent-deep cursor-pointer" : "bg-[#B9B8B0] cursor-not-allowed"}`}>
                    Schedule
                  </button>
                )}
                {scheduled && <Btn disabled={busy} onClick={() => issueAction("unschedule", "Moved back to draft.")}>Unschedule</Btn>}
                {!published && (
                  <Btn variant="primary" disabled={!allReviewed || busy}
                    onClick={() => { if (window.confirm("Publish now and email every subscriber?")) issueAction("publish_now", "Published.") }}>
                    Publish now
                  </Btn>
                )}
                {published && !issue.email_sent_at && (
                  <Btn variant="primary" disabled={busy} onClick={() => issueAction("resend_email", "Email sent.")}>Send email</Btn>
                )}
              </div>
            </div>

            <Notice message={message} />

            {/* Hooks bar */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] border border-hair bg-card mt-4">
              <div className="px-4 py-3.5">
                <div className="font-sans font-bold text-[10.5px] leading-none tracking-button uppercase text-accent">If you read one thing</div>
                <div className="font-display font-semibold text-[15.5px] leading-[1.3] mt-1.5">{desk.hooks.mustRead?.title || "Not set"}</div>
                <div className="font-sans text-xs text-meta mt-1">
                  {desk.hooks.mustRead ? "Change it with \"Set as must-read\" on any story" : "Until set, the lead story is used"}
                </div>
              </div>
              <div className="px-4 py-3.5 border-t md:border-t-0 md:border-l border-hair">
                <div className="font-sans font-bold text-[10.5px] leading-none tracking-button uppercase text-accent">Games teaser</div>
                <div className="font-sans text-[13.5px] leading-[1.45] text-ink-2 mt-1.5">
                  {desk.hooks.gamesTeaser?.lastAnswer
                    ? <>Last week: <b>{desk.hooks.gamesTeaser.lastAnswer}</b>{desk.hooks.gamesTeaser.pctCorrect != null && ` · ${desk.hooks.gamesTeaser.pctCorrect}% of ${desk.hooks.gamesTeaser.plays}`}</>
                    : "No answers from last week yet"}
                  <span className="text-meta"> · auto-filled from plays</span>
                </div>
              </div>
              <div className="px-4 py-3.5 border-t md:border-t-0 md:border-l border-hair">
                <div className="font-sans font-bold text-[10.5px] leading-none tracking-button uppercase text-accent">Reply to play</div>
                <input value={replyPrompt} onChange={e => setReplyPrompt(e.target.value)} placeholder="Hint: home to the Fedchenko Glacier"
                  onBlur={() => replyPrompt !== (issue.reply_prompt || "") && issueAction("update", "Reply prompt saved.", { reply_prompt: replyPrompt })}
                  className={`${smallCls} mt-1.5 py-[7px]`} aria-label="Reply to play hint" />
                <div className="font-sans text-xs text-meta mt-1">
                  {desk.hooks.lastIssueReplyCount} {desk.hooks.lastIssueReplyCount === 1 ? "reply" : "replies"} to last week&apos;s guess
                  {desk.hooks.replyCount ? ` · ${desk.hooks.replyCount} to this issue` : ""}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 lg:gap-7 pt-5">
              <nav className="flex lg:flex-col border-t-2 border-ink overflow-x-auto no-scrollbar lg:self-start">
                {DESK_SECTIONS.map(s => (
                  <button key={s.key} type="button" onClick={() => setActive(s.key)}
                    className={`flex-none flex justify-between items-center gap-2.5 px-3 py-3 border-b border-hair border-l-[3px] text-left font-sans text-[14.5px] text-ink cursor-pointer ${
                      s.key === active ? "border-l-accent bg-card font-bold" : "border-l-transparent font-medium hover:bg-card"}`}>
                    <span className="whitespace-nowrap">{s.label}</span>
                    {statusChip(s.key)}
                  </button>
                ))}
                <div className="hidden lg:block px-1 py-3.5 font-sans text-[12.5px] leading-[1.5] text-meta">
                  Every section must be reviewed or skipped before scheduling.
                </div>
              </nav>

              <section>
                <div className="flex flex-wrap justify-between items-end gap-4 pb-3.5 border-b-2 border-ink">
                  <div>
                    <div className="font-sans font-bold text-label leading-none tracking-label uppercase text-accent">Section</div>
                    <h2 className="font-display font-bold text-h1 leading-[1.1] mt-1.5">{def.label}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-sans font-medium text-[13px] text-ink-3">
                      {rows.length
                        ? `${rows.length} ${rows.length === 1 ? "item" : "items"} · ${rows.filter(r => r.status === "approved").length} approved · ${rows.filter(r => r.status === "discarded").length} discarded`
                        : "No items"}
                    </span>
                    {def.creatable && !published && <Btn disabled={busy} onClick={add}>+ Add item</Btn>}
                  </div>
                </div>

                {activeReview?.skipped && (
                  <div className="mt-3.5 flex flex-wrap justify-between items-center gap-3 bg-paper-2 border border-hair px-4 py-3">
                    <span className="font-sans text-sm text-ink-3">This section is skipped and won&apos;t appear in the issue.</span>
                    <Btn onClick={() => section("reopen")}>Undo skip</Btn>
                  </div>
                )}

                {rows.length === 0 && (
                  <div className="mt-3.5 border border-dashed border-[#B9B8B0] bg-card px-6 py-12 text-center">
                    <div className="font-display font-bold text-[22px] leading-[1.2]">Nothing for {def.label} this week</div>
                    <p className="mt-2 mb-[18px] mx-auto max-w-[420px] font-sans text-[15px] leading-[1.55] text-ink-3">
                      {active === "comics"
                        ? "No strips uploaded for this issue yet. Upload one from the Comics tab, or skip the section."
                        : "The pipeline found nothing. Add an item by hand, or skip the section and it won't appear in the issue."}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2.5">
                      {def.creatable && <Btn variant="primary" onClick={add}>+ Add item</Btn>}
                      {def.skippable && !activeReview?.reviewed && <Btn onClick={() => section("skip")}>Skip this week</Btn>}
                    </div>
                  </div>
                )}

                {rows.map((row, index) => {
                  const isLead = active === "news" && row.is_lead
                  const isMust = active === "news" && desk.hooks.mustRead?.id === row.id
                  const ai = row.ai_draft ?? row.is_ai_suggested
                  const bar = isLead || isMust ? "border-l-accent" :
                    row.status === "approved" ? "border-l-[#A9D1B8]" :
                    row.status === "discarded" ? "border-l-[#E5B3A8]" : "border-l-[#E2C98A]"
                  return (
                    <div key={row.id} className={`bg-card border border-hair border-l-[3px] ${bar} mt-3.5 px-4 py-4 sm:px-[18px] ${row.status === "discarded" ? "opacity-55" : ""}`}>
                      <div className="flex flex-wrap justify-between gap-3 items-center mb-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          {ai && <span className="font-mono font-semibold text-[10px] leading-none tracking-[.04em] px-1.5 py-1 bg-ink text-paper">AI DRAFT</span>}
                          {isMust && <span className="font-sans font-bold text-[10px] leading-none tracking-meta uppercase px-[7px] py-1 bg-ink text-paper">If you read one thing</span>}
                          {isLead && <span className="font-sans font-bold text-[10px] leading-none tracking-meta uppercase px-[7px] py-1 bg-accent text-paper">★ Lead</span>}
                          <ItemBadges section={active} row={row} />
                        </div>
                        {row.status && <StatusText status={row.status} />}
                      </div>

                      <ItemFields section={active} row={row} val={val} edit={edit} />

                      <div className="flex flex-wrap gap-2 mt-3">
                        {row.status === "draft" && <Btn variant="approve" disabled={busy} onClick={() => item(def.table, "approve", row.id)}>Approve</Btn>}
                        {edits[row.id] && <Btn disabled={busy} onClick={() => save(row)}>Save edits</Btn>}
                        {active === "news" && !isLead && <Btn disabled={busy} onClick={() => item("stories", "set_lead", row.id)}>Set as lead</Btn>}
                        {active === "news" && !isMust && <Btn disabled={busy} onClick={() => item("stories", "set_must_read", row.id)}>Set as must-read</Btn>}
                        {SORTABLE.has(def.table) && rows.length > 1 && (
                          <>
                            <Btn disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Move up">↑</Btn>
                            <Btn disabled={busy || index === rows.length - 1} onClick={() => move(index, 1)} aria-label="Move down">↓</Btn>
                          </>
                        )}
                        <span className="flex-1" />
                        {row.status === "discarded"
                          ? <Btn variant="danger" disabled={busy} onClick={() => item(def.table, "restore", row.id)}>Restore</Btn>
                          : row.status && <Btn variant="danger" disabled={busy} onClick={() => item(def.table, "discard", row.id)}>Discard</Btn>}
                        {def.creatable && (
                          <Btn variant="danger" disabled={busy}
                            onClick={() => { if (window.confirm("Delete this item permanently?")) item(def.table, "delete", row.id) }}>Delete</Btn>
                        )}
                      </div>
                    </div>
                  )
                })}

                {!activeReview?.skipped && !published && (
                  <div className="flex flex-wrap justify-between items-center gap-3 mt-5 pt-4 border-t border-hair">
                    {def.skippable && !activeReview?.reviewed
                      ? <Btn variant="quiet" className="py-3 px-4" onClick={() => section("skip")}>Skip this week</Btn>
                      : <span />}
                    {activeReview?.reviewed ? (
                      <div className="flex items-center gap-3">
                        <span className="font-sans font-bold text-xs tracking-meta uppercase text-accent">Section reviewed ✓</span>
                        <Btn variant="quiet" onClick={() => section("reopen")}>Reopen</Btn>
                      </div>
                    ) : (
                      <BigBtn onClick={() => section("reviewed")}>Mark section reviewed ✓</BigBtn>
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** Region, type and source details shown next to the AI-draft badge. */
const ItemBadges = ({ section, row }: { section: DeskSection; row: Row }) => {
  const meta = (text: string) => <span className="font-sans font-medium text-xs text-meta">{text}</span>
  switch (section) {
    case "news":
      return <><RegionPill region={row.region} />{meta([row.source_name, row.topic, row.scraped_at ? `scraped ${formatDate(row.scraped_at, "dayMonth")}` : null].filter(Boolean).join(" · "))}</>
    case "country_desk":
      return <><RegionPill region={row.region} />{meta(`${(row.source_urls || []).length} sources · ${(row.source_languages || []).join(", ").toUpperCase() || "no languages"}${row.desk_number ? ` · desk ${row.desk_number}` : ""}`)}</>
    case "data_drops":
      return <><RegionPill region={row.region} />{row.link_status === "broken"
        ? <span className="font-sans font-bold text-[10.5px] tracking-meta uppercase text-danger">Link broken</span>
        : meta(row.checked_at ? `link ok · checked ${formatDate(row.checked_at, "dayMonth")}` : "link not checked yet")}</>
    case "gis_story": return <TypePill kind="story" value={row.story_type} />
    case "maps_dont_lie": return <><TypePill kind="map" value={row.map_type} />{!row.image_url && meta("No image yet. Add one in the Maps tab.")}</>
    case "events": return <><TypePill kind="event" value={row.event_type} />{meta([formatDate(row.start_date, "short"), row.location].filter(Boolean).join(" · "))}</>
    case "games": return meta("Check it on the live preview before approving.")
    default: return row.topic ? meta(row.topic) : null
  }
}

/** Editable fields per section. */
const ItemFields = ({ section, row, val, edit }: {
  section: DeskSection
  row: Row
  val: (row: Row, field: string) => Row[string]
  edit: (id: string, patch: Row) => void
}) => {
  const input = (field: string, cls = smallCls, placeholder = "") => (
    <input aria-label={field} value={val(row, field)} placeholder={placeholder}
      onChange={e => edit(row.id, { [field]: e.target.value })} className={cls} />
  )
  const area = (field: string, rows = 3, cls = bodyCls) => (
    <textarea aria-label={field} value={val(row, field)} rows={rows}
      onChange={e => edit(row.id, { [field]: e.target.value })} className={cls} />
  )
  const select = (field: string, options: string[]) => (
    <select aria-label={field} value={val(row, field)} onChange={e => edit(row.id, { [field]: e.target.value })} className={smallCls}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )

  switch (section) {
    case "news":
      return <div className="flex flex-col gap-2">{input("title", titleCls)}{area("summary")}</div>
    case "gis_story":
      return <div className="flex flex-col gap-2">{input("title", titleCls)}{area("content", 14)}</div>
    case "maps_dont_lie":
      return (
        <div className="flex flex-col gap-2">
          {input("title", titleCls)}
          {row.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={row.image_url} alt={row.title} className="w-full max-h-72 object-contain bg-paper-2 border border-hair" />
          )}
          {area("commentary", 6)}
        </div>
      )
    case "comics":
      return (
        <div className="flex flex-col gap-2">
          {input("title", titleCls)}
          {row.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={row.image_url} alt={row.title} className="w-full border border-hair" />
          )}
        </div>
      )
    case "games":
      return <div className="font-display font-semibold text-h3 capitalize">{String(row.game_type).replace(/_/g, " ")}{row.data?.title ? `: ${row.data.title}` : ""}</div>
    case "events":
      return (
        <div className="flex flex-col gap-2">
          {input("name", titleCls)}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="date" aria-label="start_date" value={val(row, "start_date")} onChange={e => edit(row.id, { start_date: e.target.value })} className={smallCls} />
            {input("location", smallCls, "Location")}
            {input("url", smallCls, "https://")}
          </div>
          {area("description", 2)}
        </div>
      )
    case "data_drops":
      return (
        <div className="flex flex-col gap-2">
          {input("name", titleCls)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {input("publisher", smallCls, "Publisher")}
            {input("url", smallCls, "https://")}
            {select("region", REGIONS)}
            {select("format", DATASET_FORMATS)}
            {input("licence", smallCls, "Licence, e.g. CC BY 4.0")}
            {input("resolution", smallCls, "Resolution, e.g. 10 m or Vector")}
          </div>
        </div>
      )
    case "country_desk":
      return <CountryDeskFields row={row} val={val} edit={edit} input={input} area={area} select={select} />
    case "quote":
      return (
        <div className="flex flex-col gap-2">
          {area("quote_text", 3, `${softInputCls} font-serif italic text-lg leading-[1.45] resize-y`)}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{input("quote_author", smallCls, "Author")}{input("quote_role", smallCls, "Author role")}</div>
        </div>
      )
    case "jokes":
      return <div className="flex flex-col gap-2">{input("setup", `${softInputCls} font-serif text-[17px]`, "Setup")}{input("punchline", `${softInputCls} font-serif italic text-[17px]`, "Punchline")}</div>
    case "fun_facts":
      return <div className="flex flex-col gap-2">{area("fact", 2)}{input("source", smallCls, "Source")}</div>
    case "features":
      return (
        <div className="flex flex-col gap-2">
          {input("title", titleCls, "Title")}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{select("type", FEATURE_TYPES)}{input("author_name", smallCls, "Author / byline")}</div>
          {area("body_markdown", 12)}
        </div>
      )
    default:
      return null
  }
}

/** Country desk: intro, up to 5 facts and up to 3 people to follow. */
const CountryDeskFields = ({ row, val, edit, input, area, select }: {
  row: Row
  val: (row: Row, field: string) => Row[string]
  edit: (id: string, patch: Row) => void
  input: (field: string, cls?: string, placeholder?: string) => React.ReactNode
  area: (field: string, rows?: number, cls?: string) => React.ReactNode
  select: (field: string, options: string[]) => React.ReactNode
}) => {
  const facts: { key: string; value: string }[] = val(row, "facts") || []
  const follow: { name: string; why: string }[] = val(row, "follow") || []
  const setFact = (i: number, patch: Partial<{ key: string; value: string }>) =>
    edit(row.id, { facts: facts.map((f, j) => (j === i ? { ...f, ...patch } : f)) })
  const setFollow = (i: number, patch: Partial<{ name: string; why: string }>) =>
    edit(row.id, { follow: follow.map((f, j) => (j === i ? { ...f, ...patch } : f)) })
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px] gap-2">{input("country", titleCls)}{select("region", REGIONS)}</div>
      {area("intro", 5)}
      <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta mt-2">Facts ({facts.length}/5)</div>
      {facts.map((f, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2">
          <input aria-label="Fact label" value={f.key} onChange={e => setFact(i, { key: e.target.value })} className={smallCls} placeholder="Open data portal" />
          <input aria-label="Fact value" value={f.value} onChange={e => setFact(i, { value: e.target.value })} className={smallCls} placeholder="data.egov.uz" />
          <Btn variant="quiet" onClick={() => edit(row.id, { facts: facts.filter((_, j) => j !== i) })} aria-label="Remove fact">×</Btn>
        </div>
      ))}
      {facts.length < 5 && <Btn className="self-start" onClick={() => edit(row.id, { facts: [...facts, { key: "", value: "" }] })}>+ Fact</Btn>}
      <div className="font-sans font-semibold text-label tracking-nav uppercase text-meta mt-2">Who to follow ({follow.length}/3)</div>
      {follow.map((f, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2">
          <input aria-label="Name" value={f.name} onChange={e => setFollow(i, { name: e.target.value })} className={smallCls} placeholder="Name or organisation" />
          <input aria-label="Why" value={f.why} onChange={e => setFollow(i, { why: e.target.value })} className={smallCls} placeholder="Why follow them" />
          <Btn variant="quiet" onClick={() => edit(row.id, { follow: follow.filter((_, j) => j !== i) })} aria-label="Remove">×</Btn>
        </div>
      ))}
      {follow.length < 3 && <Btn className="self-start" onClick={() => edit(row.id, { follow: [...follow, { name: "", why: "" }] })}>+ Person</Btn>}
      {(row.source_urls || []).length > 0 && (
        <details className="mt-2 font-sans text-[13px] text-ink-3">
          <summary className="cursor-pointer text-accent">Original sources ({row.source_urls.length})</summary>
          <ul className="mt-2 flex flex-col gap-1 break-all">
            {row.source_urls.map((u: string) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{u}</a></li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

export default EditorsDeskPage
