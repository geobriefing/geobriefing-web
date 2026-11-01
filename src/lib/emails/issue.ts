/**
 * Monthly issue email, rendered at send time from the same getIssue() data as the web page.
 * Table-based, 600px wide and fluid below that, Georgia and Arial, inline styles only.
 * Sections follow the reading order: open (editor's desk), catch up (the month in 60
 * seconds, the editor's pick), explore (big story, country desk, map, GIS story),
 * use (data drops, calendar), the small things (cartoon, fact, quote, joke), play
 * (games, last month's answers, guess the country) and leave (next issue, forward).
 * Anything not approved for this issue is left out.
 */
import type { IssueData } from "@/lib/issue"
import type { SiteSettings } from "@/lib/settings"
import { formatDate, paragraphs } from "@/lib/format"
import { siteUrl } from "@/lib/site"
import { issueNo, nextIssueDate } from "@/lib/schedule"

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// Hex stand-ins for the oklch region pills (email clients don't support oklch).
const PILL: Record<string, [string, string, string]> = {
  "South Asia": ["#e6f4ec", "#1f5a3c", "#bfe0cc"],
  "Middle East": ["#fbebe2", "#7a3a1c", "#ecc9b6"],
  "Central Asia": ["#f8efdc", "#6a4a10", "#e6d3a8"],
  "Europe": ["#f1ebf7", "#5a3a78", "#dcccec"],
  "North America": ["#e8f0fa", "#26487a", "#c6d8ef"],
  "Africa": ["#f1f2dc", "#55581a", "#dfe1b3"],
  "Oceania": ["#e2f3f3", "#1d5a5c", "#bfe0e0"],
  "Global": ["#efefec", "#55554f", "#d6d6d0"],
}

const pill = (region: string | null) => {
  if (!region) return ""
  const [bg, fg, bd] = PILL[region] || PILL.Global
  return `<span style="font:bold 10px Arial,sans-serif;letter-spacing:1px;padding:3px 6px;background:${bg};color:${fg};border:1px solid ${bd}">${esc(region.toUpperCase())}</span>`
}

const label = (text: string, color = "#1a6b3c") =>
  `<div style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:${color};text-transform:uppercase">${esc(text)}</div>`

const row = (inner: string, pad = "0 32px") => `<tr><td style="padding:${pad}">${inner}</td></tr>`

const P = "margin:8px 0 0;font:16px/1.6 Georgia,serif;color:#2b2b28"
const SMALL = "margin:8px 0 0;font:14px/1.55 Arial,sans-serif;color:#4a4a45"

/** Section head: 2px rule, the section name, a serif subhead and an optional line of intro. */
const sectionHead = (name: string, subhead?: string, intro?: string) =>
  row(`<div style="border-top:2px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div>
<div style="padding-top:12px">${label(name)}</div>
${subhead ? `<div style="font:bold 24px/1.2 Georgia,serif;color:#1a1a1a;margin-top:6px">${subhead}</div>` : ""}
${intro ? `<p style="${SMALL}">${intro}</p>` : ""}`, "36px 32px 4px")

const button = (href: string, text: string, dark = true) =>
  `<a href="${href}" style="display:inline-block;background:${dark ? "#1a1a1a" : "#1a6b3c"};color:#FAFAF7;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:13px 20px">${text}</a>`

const more = (href: string, text: string) =>
  `<div style="margin-top:10px"><a href="${href}" style="font:bold 11px Arial,sans-serif;letter-spacing:1.5px;color:#1a6b3c;text-decoration:none">${text} &rarr;</a></div>`

/** The first sentence of a summary, for the 60-second list. */
const firstSentence = (text: string | null) => {
  if (!text) return ""
  const m = text.match(/^.*?[.!?](\s|$)/)
  return (m ? m[0] : text).trim()
}

/** A readable excerpt of Markdown: no headings, emphasis or link syntax, cut at a word. */
const excerpt = (markdown: string, max = 420) => {
  const plain = markdown
    .split(/\n{2,}/).map(p => p.trim()).find(p => p && !p.startsWith("#")) || ""
  const text = plain.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim()
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`
}

export const renderIssueEmail = (d: IssueData, s: SiteSettings, opts: { unsubscribeUrl: string }) => {
  const site = siteUrl()
  const host = site.replace(/^https?:\/\//, "")
  const issueUrl = `${site}/issues/${d.issue.slug}`
  const has = (id: string) => d.sections.some(x => x.id === id)
  const no = issueNo(d.issue.issue_number)
  const next = nextIssueDate(s)
  const editorFirst = s.editorName.split(/\s+/)[0] || ""
  const parts: string[] = []

  // ── Masthead: 2x PNG wordmark with live-text alt (SVG and web fonts are blocked in Gmail and Outlook).
  parts.push(row(`<div style="border-top:4px solid #1a1a1a;height:3px;font-size:0;line-height:3px">&nbsp;</div><div style="border-top:1px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div>`, "24px 32px 0"))
  parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:#1a1a1a">ISSUE ${no} · ${esc(formatDate(d.issue.published_at || new Date().toISOString(), "long").toUpperCase())}</td>
<td align="right" style="font:11px Arial,sans-serif;color:#66665f">${d.readTimeMinutes} min read</td></tr></table>`, "8px 32px"))
  parts.push(`<tr><td align="center" style="padding:18px 32px 14px;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a">
<a href="${site}" style="text-decoration:none;color:#1a1a1a"><img src="${site}/email/wordmark@2x.png" width="280" height="56" alt="GeoBriefing" style="display:block;border:0;width:280px;max-width:100%;height:auto;font:bold 34px Georgia,serif;color:#1a1a1a"></a>
<div style="font:bold 8px Arial,sans-serif;letter-spacing:4px;margin-top:10px;color:#1a1a1a">SPATIAL INTELLIGENCE · MONTHLY</div></td></tr>`)
  parts.push(row(`<h1 style="margin:0;font:bold 32px/1.1 Georgia,serif;color:#1a1a1a;letter-spacing:-0.3px">${esc(d.issue.headline)}</h1>`, "28px 32px 0"))

  // ── OPEN: the editor's desk
  if (d.issue.editor_note) {
    const photo = s.editorPhotoUrl
      ? `<img src="${esc(s.editorPhotoUrl)}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border-radius:18px;border:0">`
      : `<div style="width:36px;height:36px;border-radius:18px;background:#d8d7d0"></div>`
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="border-left:3px solid #1a6b3c;background:#f0f7f3;padding:16px 18px">${label("The editor's desk")}
<p style="margin:8px 0 0;font:17px/1.6 Georgia,serif;color:#2b2b28">${esc(d.issue.editor_note)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px"><tr><td width="40" style="vertical-align:middle">${photo}</td>
<td style="padding-left:10px;font:13px/1.4 Arial,sans-serif;color:#4a4a45">${s.editorName ? `<b style="color:#1a1a1a">${esc(s.editorName)}</b><br>` : ""}Hit reply. I read every email.</td></tr></table></td></tr></table>`, "22px 32px 0"))
  }

  // ── CATCH UP: the month in 60 seconds
  if (has("news")) {
    const count = d.stories.length
    parts.push(sectionHead("The month in 60 seconds",
      `${count} ${count === 1 ? "story" : "stories"}. One month. The parts worth remembering.`,
      "The geospatial world had another busy month. We went through it so you don&rsquo;t have to pretend you read 146 open tabs."))
    d.stories.forEach(st => parts.push(`<tr><td style="padding:12px 32px;border-bottom:1px solid #dddcd5">${pill(st.region)}
<div style="font:bold 17px/1.3 Georgia,serif;margin-top:7px"><a href="${issueUrl}#story-${st.id}" style="color:#1a1a1a;text-decoration:none">${esc(st.title)}</a></div>
${st.summary ? `<p style="margin:4px 0 0;font:15px/1.5 Georgia,serif;color:#2b2b28">${esc(firstSentence(st.summary))}</p>` : ""}
<div style="margin-top:5px;font:bold 10px Arial,sans-serif;letter-spacing:1px"><a href="${esc(st.source_url)}" style="color:#1a6b3c;text-decoration:none">${esc((st.source_name || "Source").toUpperCase())} &#8599;</a></div></td></tr>`))
  }

  // ── If you read one thing
  if (d.mustRead) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:2px solid #1a1a1a"><tr><td style="padding:18px 20px">${label("If you read one thing")}
<div style="font:bold 13px Arial,sans-serif;color:#66665f;margin-top:4px">The editor&rsquo;s pick. Of everything published this month, start here.</div>
<div style="font:bold 21px/1.25 Georgia,serif;margin-top:10px"><a href="${esc(d.mustRead.source_url)}" style="color:#1a1a1a;text-decoration:none">${esc(d.mustRead.title)}</a></div>
${d.mustRead.summary ? `<p style="${P}">${esc(d.mustRead.summary)}</p>` : ""}
${more(esc(d.mustRead.source_url), `Read it at ${esc(d.mustRead.source_name || "the source")}`)}</td></tr></table>`, "28px 32px 0"))
  }

  // ── EXPLORE: the big story
  if (has("feature") && d.feature) {
    parts.push(sectionHead("The big story", esc(d.feature.title)))
    parts.push(row(`<div style="font:bold 10px Arial,sans-serif;letter-spacing:1.5px;color:#66665f;margin-top:4px">${esc(d.feature.type.toUpperCase())} · BY ${esc(d.feature.author_name.toUpperCase())}</div>
<p style="${SMALL}">One subject, properly explored.</p>
<p style="${P}">${esc(excerpt(d.feature.body_markdown))}</p>
${more(`${issueUrl}#feature`, "READ THE FULL STORY")}`))
  }

  // ── Country desk
  if (has("country") && d.countryDesk) {
    const c = d.countryDesk
    parts.push(sectionHead("Country desk", esc(c.country)))
    parts.push(row(`${pill(c.region)}
<p style="${SMALL}">International coverage tells you what the rest of the world noticed. Country Desk looks at what <b>${esc(c.country)} itself</b> has been talking about.</p>
<p style="${P}">${esc(paragraphs(c.intro)[0] || "")}</p>
${c.facts.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px;border-top:2px solid #1a1a1a">${c.facts.map(f => `<tr><td style="padding:8px 0;border-bottom:1px solid #dddcd5;font:bold 10px Arial,sans-serif;letter-spacing:1.5px;color:#66665f;width:40%">${esc(f.key.toUpperCase())}</td><td style="padding:8px 0;border-bottom:1px solid #dddcd5;font:bold 15px Georgia,serif;color:#1a1a1a">${esc(f.value)}</td></tr>`).join("")}</table>` : ""}
${more(`${issueUrl}#country`, "READ THE DESK")}
<p style="margin:14px 0 0;font:bold 14px/1.5 Georgia,serif;color:#1a1a1a">Next month: another country, another view from inside the map.</p>`))
  }

  // ── Maps don't lie
  if (has("maps") && d.map) {
    const m = d.map
    parts.push(sectionHead("Maps don&rsquo;t lie", "People occasionally do.", "One map worth stopping for, and the story behind what it shows."))
    parts.push(row(`${m.image_url ? `<a href="${issueUrl}#maps"><img src="${esc(m.image_url)}" width="536" alt="${esc(m.title)}" style="display:block;width:100%;max-width:536px;height:auto;border:1px solid #dddcd5;margin-top:8px"></a>` : ""}
${m.image_credit ? `<div style="font:11px Arial,sans-serif;color:#66665f;margin-top:5px">Map: ${esc(m.image_credit)}</div>` : ""}
<div style="font:bold 19px/1.3 Georgia,serif;color:#1a1a1a;margin-top:12px">${esc(m.title)}</div>
<p style="${P}">${esc(paragraphs(m.commentary)[0] || "")}</p>
${more(`${issueUrl}#maps`, "SEE THE MAP")}`))
  }

  // ── The GIS story
  if (has("story") && d.gisStory) {
    const g = d.gisStory
    parts.push(sectionHead("The GIS story", "Geography has entered the chat.",
      "A story from science, history, culture, infrastructure or everyday life where location turns out to be rather important. Again."))
    parts.push(row(`<div style="font:bold 19px/1.3 Georgia,serif;color:#1a1a1a;margin-top:6px">${esc(g.title)}</div>
<p style="${P}">${esc(paragraphs(g.content)[0] || "")}</p>
${more(`${issueUrl}#story`, "READ THE STORY")}`))
  }

  // ── USE: data drops
  if (has("data")) {
    parts.push(sectionHead("Data drops", "Worth the download.",
      "New datasets, portals, imagery, tools and open geospatial resources worth saving before you forget they exist."))
    d.datasets.forEach(x => parts.push(`<tr><td style="padding:12px 32px;border-bottom:1px solid #dddcd5">${pill(x.region)}
<div style="font:bold 16px/1.3 Georgia,serif;margin-top:6px;color:#1a1a1a">${esc(x.name)}</div>
<div style="font:13px Arial,sans-serif;color:#4a4a45;margin-top:2px">${esc([x.publisher, x.format, x.licence, x.resolution].filter(Boolean).join(" · "))}</div>
<div style="margin-top:6px"><a href="${esc(x.url)}" style="font:bold 11px Arial,sans-serif;letter-spacing:1.5px;color:#1a6b3c;text-decoration:none">GET DATA &#8599;</a></div></td></tr>`))
  }

  // ── On the calendar
  if (has("events")) {
    parts.push(sectionHead("On the calendar", "Places to be. Physically or otherwise.",
      "Conferences, webinars, workshops, calls, exhibitions and other dates worth putting on your map."))
    d.events.forEach(e => parts.push(`<tr><td style="padding:11px 32px;border-bottom:1px solid #dddcd5">
<div style="font:bold 11px Arial,sans-serif;letter-spacing:1.5px;color:#1a6b3c">${esc(formatDate(e.start_date, "dayMonth").toUpperCase())}${e.end_date && e.end_date !== e.start_date ? ` &ndash; ${esc(formatDate(e.end_date, "dayMonth").toUpperCase())}` : ""}</div>
<div style="font:bold 16px/1.3 Georgia,serif;margin-top:4px"><a href="${esc(e.url)}" style="color:#1a1a1a;text-decoration:none">${esc(e.name)}</a></div>
<div style="font:13px Arial,sans-serif;color:#4a4a45;margin-top:2px">${esc([e.organizer, e.location, e.is_online && e.location !== "Online" ? "Online" : null, e.is_free ? "Free" : null].filter(Boolean).join(" · "))}</div></td></tr>`))
  }

  // ── The small things: cartoon, fact, quote, joke
  if (has("comics")) {
    parts.push(sectionHead("The cartoon", undefined, "Some things are better explained with considerably fewer words."))
    d.comics.forEach(c => parts.push(row(c.image_url
      ? `<a href="${issueUrl}#comics"><img src="${esc(c.image_url)}" width="536" alt="${esc(c.title)}" style="display:block;width:100%;max-width:536px;height:auto;border:1px solid #1a1a1a;margin-top:8px"></a>
<div style="font:13px Arial,sans-serif;color:#4a4a45;margin-top:5px">${esc(c.title)}</div>`
      : more(`${issueUrl}#comics`, esc(c.title)))))
  }

  const fact = d.facts[0]
  if (fact) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#F2F1EB;border-top:2px solid #1a1a1a"><tr><td style="padding:16px 18px">${label("One strange planet")}
<div style="font:bold 13px Arial,sans-serif;color:#66665f;margin-top:4px">This month&rsquo;s geographical fact.</div>
<p style="margin:10px 0 0;font:16px/1.55 Georgia,serif;color:#1a1a1a">${esc(fact.fact)}</p>
<p style="margin:8px 0 0;font:italic 13px Arial,sans-serif;color:#66665f">Yes, we checked.${fact.source_url ? ` <a href="${esc(fact.source_url)}" style="color:#66665f">Source</a>` : ""}</p></td></tr></table>`, "32px 32px 0"))
  }

  if (d.quote) {
    const q = d.quote
    parts.push(row(`${label("In the margins")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px"><tr><td style="border-left:3px solid #1a1a1a;padding:2px 0 2px 16px;font:italic 19px/1.4 Georgia,serif;color:#1a1a1a">&ldquo;${esc(q.quote_text)}&rdquo;
<div style="font:bold 10px Arial,sans-serif;letter-spacing:1.5px;color:#66665f;margin-top:8px;font-style:normal">${esc(q.quote_author.toUpperCase())}${q.quote_role ? `, ${esc(q.quote_role.toUpperCase())}` : ""}</div></td></tr></table>`, "28px 32px 0"))
  }

  const joke = d.jokes[0]
  if (joke) {
    parts.push(row(`${label("Spatial humour")}
<p style="margin:10px 0 0;font:16px/1.55 Georgia,serif;color:#2b2b28">${esc(joke.setup)} <i>${esc(joke.punchline)}</i></p>
<p style="margin:8px 0 0;font:italic 13px Arial,sans-serif;color:#66665f">We make no formal claims regarding the quality of this section.</p>`, "28px 32px 0"))
  }

  // ── PLAY
  const g = d.games
  if (has("games")) {
    const game = (name: string, title: string, text: string, cta: string) =>
      `<tr><td style="padding:16px 22px 0">${label(name, "#cfe6d8")}
<div style="font:bold 20px/1.25 Georgia,serif;color:#ffffff;margin-top:4px">${title}</div>
<p style="margin:6px 0 12px;font:14px/1.5 Arial,sans-serif;color:#e6f4ec">${text}</p>
<a href="${issueUrl}#games" style="display:inline-block;background:#FAFAF7;color:#1a1a1a;font:bold 11px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:11px 16px">${cta} &rarr;</a></td></tr>`
    const blocks = [
      g.satellite && game("Satellite Spot", "What are you looking at?", "One satellite image. A few possibilities. No helpful labels. Choose carefully.", "PLAY SATELLITE SPOT"),
      g.geoguesser && game("Where on Earth?", "A place. No name.", "Work out where you are using whatever the landscape is willing to tell you.", "PLAY WHERE ON EARTH"),
      g.crossword && game("The Grid", "Your monthly geospatial crossword.", "GIS, geography, remote sensing, cartography and the occasional clue designed to make you question whether you actually work in this field.", "PLAY THE GRID"),
    ].filter(Boolean)
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a6b3c">
<tr><td style="padding:22px 22px 0"><div style="font:bold 26px/1.15 Georgia,serif;color:#ffffff">Play. Enough reading.</div>
<p style="margin:6px 0 0;font:14px/1.5 Arial,sans-serif;color:#e6f4ec">Three ways to discover how much you actually know about the planet.</p></td></tr>
${blocks.join("")}
<tr><td style="padding:0 0 22px;font-size:0;line-height:0">&nbsp;</td></tr></table>`, "36px 32px 0"))
  }

  // ── Last month's answers
  if (d.lastIssue) {
    const lw = d.lastIssue
    const result = (x: (typeof lw.games)[number]) => x.type === "crossword"
      ? `<a href="${site}/issues/${lw.slug}#games" style="color:#1a6b3c;font-weight:bold">View completed grid &rarr;</a>`
      : x.type === "geoguesser"
        ? (x.pctCorrect != null ? `<b>${x.pctCorrect}% found it.</b>` : x.closestKm != null ? `Closest pin: ${x.closestKm} km away.` : "")
        : (x.pctCorrect != null ? `<b>${x.pctCorrect}% got it right.</b>` : "")
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#F2F1EB;border-top:2px solid #1a1a1a"><tr><td style="padding:16px 18px">${label(`Last month's answers · Issue ${issueNo(lw.issueNumber)}`)}
<div style="font:bold 18px Georgia,serif;color:#1a1a1a;margin-top:6px">The results are in.</div>
${lw.games.map(x => `<div style="margin-top:12px;font:14px/1.5 Arial,sans-serif;color:#2b2b28"><b style="color:#1a1a1a">${esc(x.label)}</b><br>${x.type === "crossword" ? "" : `${esc(x.answer)}<br>`}${result(x)}</div>`).join("")}
<p style="margin:14px 0 0;font:14px/1.5 Arial,sans-serif;color:#2b2b28">Got all three? Excellent. Remain humble.</p></td></tr></table>`, "28px 32px 0"))
  }

  // ── Guess the country
  if (d.issue.reply_prompt) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:2px solid #1a1a1a"><tr><td style="padding:18px 20px">${label("Guess the country")}
<div style="font:bold 21px/1.25 Georgia,serif;margin-top:6px;color:#1a1a1a">Where are we going next?</div>
<p style="${SMALL}">Next month&rsquo;s Country Desk is already underway. Here&rsquo;s your clue:</p>
<p style="margin:10px 0 0;font:bold 17px/1.5 Georgia,serif;color:#1a1a1a">${esc(d.issue.reply_prompt)}</p>
<p style="${SMALL}">Know the country? <b>Reply to this email with your guess.</b> That&rsquo;s it.</p>
<p style="${SMALL}">No account. No form. No CAPTCHA requiring you to identify a bicycle from nine increasingly questionable photographs. Correct answer in the next issue.</p></td></tr></table>`, "28px 32px 0"))
  }

  // ── LEAVE: next issue
  parts.push(sectionHead("Next issue", `Coming on the 1st of ${esc(next.month)}`))
  parts.push(row(`${d.issue.teaser ? `<p style="${P}"><i>${esc(d.issue.teaser)}</i></p>` : ""}
<p style="${P}">A new Country Desk.<br>A new map.<br>Three new games.<br>Thirty more days of the planet behaving strangely.</p>
<p style="${P}">Until then.</p>
${editorFirst ? `<p style="margin:10px 0 0;font:bold 16px Georgia,serif;color:#1a1a1a">&mdash; ${esc(editorFirst)}</p>` : ""}
<div style="margin-top:18px">${button(issueUrl, "READ THIS ISSUE ONLINE &rarr;")}</div>`))

  // ── Forward this issue
  parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a1a1a"><tr><td align="center" style="padding:28px 24px;color:#FAFAF7">
<div style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:#7FCF9F">FORWARD THIS ISSUE</div>
<div style="font:bold 23px Georgia,serif;margin-top:6px">Know someone who&rsquo;d read this?</div>
<p style="margin:8px 0 16px;font:14px/1.55 Arial,sans-serif;color:#cfcec6">Forward it. Especially if they&rsquo;re the sort of person who points out incorrect map projections without being asked. They&rsquo;ll fit in.</p>
${button(`${site}/subscribe`, "SUBSCRIBE &rarr;", false)}</td></tr></table>`, "36px 32px"))

  // ── Footer
  const link = (href: string, text: string) => `<a href="${href}" style="color:#66665f">${text}</a>`
  parts.push(`<tr><td align="center" style="padding:0 32px 32px;font:12px/1.65 Arial,sans-serif;color:#66665f">
<b style="color:#1a1a1a;font:bold 14px Georgia,serif">GeoBriefing</b><br>
An independent monthly publication about maps, GIS, Earth observation, GeoAI, spatial intelligence and the geography behind the world we live in.<br>
${s.editorName ? `<b>Edited by ${esc(s.editorName)}</b><br>` : ""}
<span style="line-height:2.2">${[link(issueUrl, "Read online"), link(`${site}/issues`, "Archive"), link(`${site}/about`, "About"), link(`${site}/sources`, "Sources"), link(`${site}/subscribe`, "Subscribe"), link(opts.unsubscribeUrl, "Unsubscribe")].join(" · ")}</span><br>
You received this because you subscribed at ${esc(host)}.<br>
&copy; ${new Date().getFullYear()} GeoBriefing<br>
<b style="color:#1a1a1a;letter-spacing:1px">Read the world spatially.</b></td></tr>`)

  // Inbox preview line.
  const highlights = [d.mustRead?.title || d.stories[0]?.title, d.countryDesk?.country].filter(Boolean)
  const preheader = `This month: ${highlights.length ? `${highlights.join(", ")}, ` : ""}maps worth opening and three tests of your geographical confidence.`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.issue.headline)}</title></head>
<body style="margin:0;padding:0;background:#e6e5df">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#e6e5df"><tr><td align="center" style="padding:16px 0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FAFAF7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
${parts.join("\n")}
</table></td></tr></table></body></html>`

  // "№12" stays in the subject: replies are matched to the issue by it.
  const subject = `GeoBriefing ${no} — ${d.issue.headline}`
  return { subject, html }
}
