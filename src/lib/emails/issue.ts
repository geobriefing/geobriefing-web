/**
 * Weekly issue email, rendered at send time from the same getIssue() data as the web page.
 * Table-based, 600px wide and fluid below that, Georgia and Arial, inline styles only.
 * Empty sections are left out (getIssue already numbered the rest).
 */
import type { IssueData } from "@/lib/issue"
import type { SiteSettings } from "@/lib/settings"
import { formatDate } from "@/lib/format"
import { siteUrl } from "@/lib/site"

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

const sectionHead = (n: number, title: string) =>
  row(`<div style="border-top:2px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div>
<div style="padding-top:10px"><span style="font:bold 12px Arial,sans-serif;color:#1a6b3c">${String(n).padStart(2, "0")}</span>
<span style="font:bold 22px Georgia,serif;color:#1a1a1a;padding-left:8px">${esc(title)}</span></div>`, "32px 32px 4px")

export const renderIssueEmail = (d: IssueData, s: SiteSettings, opts: { unsubscribeUrl: string }) => {
  const site = siteUrl()
  const issueUrl = `${site}/issues/${d.issue.slug}`
  const n = (id: string) => d.sections.find(x => x.id === id)
  const parts: string[] = []

  // Masthead: 2x PNG wordmark with live-text alt (SVG and web fonts are blocked in Gmail and Outlook).
  parts.push(row(`<div style="border-top:4px solid #1a1a1a;height:3px;font-size:0;line-height:3px">&nbsp;</div><div style="border-top:1px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div>`, "24px 32px 0"))
  parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:#1a1a1a">ISSUE #${d.issue.issue_number} · ${esc(formatDate(d.issue.published_at || new Date().toISOString(), "long").toUpperCase())}</td>
<td align="right" style="font:11px Arial,sans-serif;color:#66665f">${d.readTimeMinutes} min read</td></tr></table>`, "8px 32px"))
  parts.push(`<tr><td align="center" style="padding:18px 32px 14px;border-top:1px solid #1a1a1a;border-bottom:1px solid #1a1a1a">
<a href="${site}" style="text-decoration:none;color:#1a1a1a"><img src="${site}/email/wordmark@2x.png" width="280" height="56" alt="GeoBriefing" style="display:block;border:0;width:280px;max-width:100%;height:auto;font:bold 34px Georgia,serif;color:#1a1a1a"></a>
<div style="font:bold 8px Arial,sans-serif;letter-spacing:4px;margin-top:10px;color:#1a1a1a">SPATIAL INTELLIGENCE · WEEKLY</div></td></tr>`)

  // Hooks strip: must-read and games teaser. Stacks on narrow screens (fluid inline-blocks).
  if (d.mustRead || d.gamesTeaser) {
    const cells: string[] = []
    if (d.mustRead) {
      cells.push(`<div style="display:inline-block;vertical-align:top;width:100%;max-width:330px"><div style="padding:12px 16px 12px 0">${label("If you read one thing")}
<a href="${issueUrl}#story-${d.mustRead.id}" style="display:block;margin-top:6px;font:bold 16px/1.3 Georgia,serif;color:#1a1a1a;text-decoration:none">${esc(d.mustRead.title)} &rarr;</a></div></div>`)
    }
    if (d.gamesTeaser) {
      const g = d.gamesTeaser
      const last = g.lastAnswer
        ? `Last week: <b>${esc(g.lastAnswer)}</b>.${g.pctCorrect != null ? ` ${g.pctCorrect}% got it.` : ""} `
        : ""
      cells.push(`<div style="display:inline-block;vertical-align:top;width:100%;max-width:200px"><div style="padding:12px 0">${label("Games")}
<div style="margin-top:6px;font:13px/1.45 Arial,sans-serif;color:#2b2b28">${last}<a href="${issueUrl}#games" style="color:#1a6b3c">${esc(g.thisWeek || "Play this week's")} &rarr;</a></div></div></div>`)
    }
    parts.push(row(`<div style="border-bottom:1px solid #1a1a1a;font-size:0">${cells.join("")}</div>`, "16px 32px 0"))
  }

  parts.push(row(`${label("This week's briefing")}<h1 style="margin:10px 0 0;font:bold 32px/1.1 Georgia,serif;color:#1a1a1a;letter-spacing:-0.3px">${esc(d.issue.headline)}</h1>`, "28px 32px 0"))

  // The week in 60 seconds: the top stories as one-line bullets, for readers who stop here.
  const top = d.stories.slice(0, 4)
  if (top.length) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid #1a1a1a;border-bottom:2px solid #1a1a1a"><tr><td style="padding:14px 0 6px">${label("The week in 60 seconds")}</td></tr>
${top.map(st => `<tr><td style="padding:7px 0;font:15px/1.45 Arial,sans-serif;color:#2b2b28"><span style="color:#1a6b3c;font-weight:bold">&#9632;</span>&nbsp; <a href="${issueUrl}#story-${st.id}" style="color:#1a1a1a;text-decoration:none"><b>${esc(st.title)}</b></a>${st.region ? ` <span style="color:#66665f">· ${esc(st.region)}</span>` : ""}</td></tr>`).join("")}
<tr><td style="padding:0 0 10px"></td></tr></table>`, "20px 32px 0"))
  }

  if (d.quote) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="border-left:3px solid #1a1a1a;padding:2px 0 2px 16px;font:italic 19px/1.4 Georgia,serif;color:#1a1a1a">&ldquo;${esc(d.quote.quote_text)}&rdquo;
<div style="font:bold 10px Arial,sans-serif;letter-spacing:1.5px;color:#66665f;margin-top:8px;font-style:normal">QUOTE OF THE WEEK · ${esc(d.quote.quote_author.toUpperCase())}</div></td></tr></table>`, "20px 32px 0"))
  }

  if (d.issue.editor_note) {
    const photo = s.editorPhotoUrl
      ? `<img src="${esc(s.editorPhotoUrl)}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border-radius:18px;border:0">`
      : `<div style="width:36px;height:36px;border-radius:18px;background:#d8d7d0"></div>`
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="border-left:3px solid #1a6b3c;background:#f0f7f3;padding:16px 18px">${label("From the editor")}
<p style="margin:8px 0 0;font:17px/1.6 Georgia,serif;color:#2b2b28">${esc(d.issue.editor_note)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px"><tr><td width="40" style="vertical-align:middle">${photo}</td>
<td style="padding-left:10px;font:13px/1.4 Arial,sans-serif;color:#4a4a45">${s.editorName ? `<b style="color:#1a1a1a">${esc(s.editorName)}</b><br>` : ""}Hit reply. I read every email.</td></tr></table></td></tr></table>`, "20px 32px 0"))
  }

  parts.push(row(`<a href="${issueUrl}" style="display:inline-block;background:#1a1a1a;color:#FAFAF7;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:14px 20px">READ THE FULL ISSUE &rarr;</a>`, "22px 32px 0"))

  // 01 News
  const news = n("news")
  if (news) {
    parts.push(sectionHead(news.n, news.title))
    d.stories.forEach(st => parts.push(`<tr><td style="padding:14px 32px;border-bottom:1px solid #dddcd5">${pill(st.region)}
<div style="font:bold 18px/1.3 Georgia,serif;margin-top:8px"><a href="${esc(st.source_url)}" style="color:#1a1a1a;text-decoration:none">${esc(st.title)}</a></div>
${st.summary ? `<p style="margin:6px 0 0;font:16px/1.55 Georgia,serif;color:#2b2b28">${esc(st.summary)}</p>` : ""}
<div style="margin-top:6px;font:bold 11px Arial,sans-serif;letter-spacing:1px"><a href="${esc(st.source_url)}" style="color:#1a6b3c;text-decoration:none">${esc((st.source_name || "Source").toUpperCase())} &#8599;</a></div></td></tr>`))
    if (d.jokes[0]) {
      parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="border-left:3px solid #1a6b3c;padding:2px 0 2px 16px">${label("GIS joke")}
<p style="margin:8px 0 0;font:16px/1.5 Georgia,serif;color:#2b2b28">${esc(d.jokes[0].setup)} <i>${esc(d.jokes[0].punchline)}</i></p></td></tr></table>`, "20px 32px 0"))
    }
  }

  // 02 Country desk
  const country = n("country")
  if (country && d.countryDesk) {
    const c = d.countryDesk
    parts.push(sectionHead(country.n, country.title))
    parts.push(row(`${pill(c.region)}<div style="font:bold 30px/1.1 Georgia,serif;color:#1a1a1a;margin-top:10px">${esc(c.country)}</div>
<p style="margin:10px 0 0;font:16px/1.6 Georgia,serif;color:#2b2b28">${esc(c.intro)}</p>
${c.facts.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:12px;border-top:2px solid #1a1a1a">${c.facts.map(f => `<tr><td style="padding:8px 0;border-bottom:1px solid #dddcd5;font:bold 10px Arial,sans-serif;letter-spacing:1.5px;color:#66665f;width:40%">${esc(f.key.toUpperCase())}</td><td style="padding:8px 0;border-bottom:1px solid #dddcd5;font:bold 15px Georgia,serif;color:#1a1a1a">${esc(f.value)}</td></tr>`).join("")}</table>` : ""}
<div style="margin-top:10px"><a href="${issueUrl}#country" style="font:bold 11px Arial,sans-serif;letter-spacing:1.5px;color:#1a6b3c;text-decoration:none">READ THE DESK &rarr;</a></div>`, "12px 32px 0"))
  }

  // Games: a bold call to play, with last week's answer as the hook.
  if (n("games")) {
    const g = d.gamesTeaser
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a6b3c"><tr><td style="padding:22px 22px">
<div style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:#cfe6d8">THIS WEEK'S GAMES</div>
<div style="font:bold 24px/1.2 Georgia,serif;color:#ffffff;margin-top:6px">Can you name it from space?</div>
<p style="margin:8px 0 16px;font:14px/1.5 Arial,sans-serif;color:#e6f4ec">${g?.lastAnswer ? `Last week it was <b style="color:#ffffff">${esc(g.lastAnswer)}</b>${g.pctCorrect != null ? ` and only ${g.pctCorrect}% got it` : ""}. ` : ""}Satellite Spot, GeoGuesser and the GIS crossword. Two minutes each.</p>
<a href="${issueUrl}#games" style="display:inline-block;background:#FAFAF7;color:#1a1a1a;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:13px 20px">PLAY NOW &rarr;</a></td></tr></table>`, "28px 32px 0"))
  }

  // Also inside: one line each for the remaining sections.
  const also: [string, string, string][] = []
  if (n("story") && d.gisStory) also.push(["GIS Story", d.gisStory.title, "story"])
  if (n("feature") && d.feature) also.push([d.feature.type, `${d.feature.title}, by ${d.feature.author_name}`, "feature"])
  if (n("maps") && d.map) also.push(["Maps Don't Lie", d.map.title, "maps"])
  if (n("comics")) also.push(["Comics", d.comics[0]?.title || "", "comics"])
  if (n("events")) also.push(["Events", `${d.events.length} upcoming, starting with ${d.events[0]?.name}`, "events"])
  if (also.length) {
    parts.push(row(`<div style="border-top:2px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div><div style="padding-top:10px">${label("Also inside")}</div>`, "32px 32px 0"))
    also.forEach(([title, teaser, anchor]) => parts.push(`<tr><td style="padding:12px 32px;border-bottom:1px solid #dddcd5"><a href="${issueUrl}#${anchor}" style="text-decoration:none;color:#1a1a1a"><span style="font:bold 16px Georgia,serif">${esc(title)}</span> <span style="font:14px Arial,sans-serif;color:#4a4a45">— ${esc(teaser)}</span></a></td></tr>`))
  }

  // Last week's answers
  if (d.lastWeek) {
    const lw = d.lastWeek
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#F2F1EB;border-top:2px solid #1a1a1a"><tr><td style="padding:16px 18px">${label(`Last week's answers · Issue #${lw.issueNumber}`)}
${lw.games.map(g => `<div style="margin-top:10px;font:14px/1.45 Arial,sans-serif;color:#2b2b28"><b>${esc(g.label)}:</b> ${esc(g.answer)}${g.pctCorrect != null ? ` · ${g.pctCorrect}% got it` : ""}${g.closestKm != null ? ` · closest pin ${g.closestKm} km away` : ""}</div>`).join("")}
<div style="margin-top:8px;font:12px Arial,sans-serif;color:#66665f">${lw.players} ${lw.players === 1 ? "reader" : "readers"} played</div></td></tr></table>`, "24px 32px 0"))
  }

  // 08 Data drops
  const data = n("data")
  if (data) {
    parts.push(sectionHead(data.n, data.title))
    d.datasets.forEach(x => parts.push(`<tr><td style="padding:12px 32px;border-bottom:1px solid #dddcd5">${pill(x.region)}
<div style="font:bold 16px/1.3 Georgia,serif;margin-top:6px;color:#1a1a1a">${esc(x.name)}</div>
<div style="font:13px Arial,sans-serif;color:#4a4a45;margin-top:2px">${esc([x.publisher, x.format, x.licence, x.resolution].filter(Boolean).join(" · "))}</div>
<div style="margin-top:6px"><a href="${esc(x.url)}" style="font:bold 11px Arial,sans-serif;letter-spacing:1.5px;color:#1a6b3c;text-decoration:none">GET DATA &#8599;</a></div></td></tr>`))
  }

  // Reply to play
  if (d.issue.reply_prompt) {
    parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:2px solid #1a1a1a"><tr><td style="padding:18px 20px">${label("Reply to play")}
<div style="font:bold 20px/1.3 Georgia,serif;margin-top:6px;color:#1a1a1a">Guess next week's country desk.</div>
<p style="margin:6px 0 0;font:14px/1.5 Arial,sans-serif;color:#2b2b28">${esc(d.issue.reply_prompt)} <b>Hit reply with your guess.</b> One word is enough.</p></td></tr></table>`, "28px 32px 0"))
  }

  if (d.issue.teaser) {
    parts.push(row(`<p style="margin:0;font:italic 16px/1.5 Georgia,serif;color:#2b2b28"><b style="font-style:normal">Next ${esc(s.publishDay)}:</b> ${esc(d.issue.teaser)}</p>`, "24px 32px 0"))
  }

  parts.push(row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a1a1a"><tr><td align="center" style="padding:28px 24px;color:#FAFAF7">
<div style="font:bold 24px Georgia,serif">Know a map nerd? Forward this.</div>
<p style="margin:8px 0 16px;font:14px/1.5 Arial,sans-serif;color:#cfcec6">GeoBriefing is free, has no ads and grows only by word of mouth. One forward is the best thanks.</p>
<a href="${site}/subscribe" style="display:inline-block;background:#1a6b3c;color:#ffffff;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:13px 20px">SEND THEM THE SIGN-UP LINK</a></td></tr></table>`, "32px"))

  parts.push(`<tr><td align="center" style="padding:0 32px 32px;font:12px/1.6 Arial,sans-serif;color:#66665f">You get this because you subscribed at ${esc(site.replace(/^https?:\/\//, ""))}.<br>
<a href="${opts.unsubscribeUrl}" style="color:#66665f">Unsubscribe</a> · <a href="${issueUrl}" style="color:#66665f">View in browser</a></td></tr>`)

  // Inbox preview line: the must-read, then what else is waiting.
  const extras = [d.stories.find(st => st.id !== d.mustRead?.id)?.title, n("games") && "this week's games"].filter(Boolean)
  const lead = (d.mustRead?.title || d.issue.headline).replace(/[.!?]$/, "")
  const preheader = extras.length ? `${lead}. Plus: ${extras.join(" and ")}.` : `${lead}.`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(d.issue.headline)}</title></head>
<body style="margin:0;padding:0;background:#e6e5df">
<div style="display:none;max-height:0;overflow:hidden">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#e6e5df"><tr><td align="center" style="padding:16px 0">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FAFAF7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
${parts.join("\n")}
</table></td></tr></table></body></html>`

  // "#12" stays in the subject: replies are matched to the issue by it.
  const subject = `${d.issue.headline} · GeoBriefing #${d.issue.issue_number}`
  return { subject, html }
}
