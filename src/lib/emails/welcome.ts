/**
 * Welcome email. Table-based, 600px, Georgia and Arial only, inline styles.
 * The wordmark is a 2x PNG with "GeoBriefing" as its alt text.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const INCLUDES: [string, string][] = [
  ["The news that matters", "GIS from South Asia, the Middle East, Central Asia and beyond. Sorted, summed up, sourced."],
  ["Country desk", "one country, mapped in a handful of hard facts."],
  ["One great story", "people doing remarkable things with maps."],
  ["Maps Don't Lie", "a map worth arguing about."],
  ["Games", "spot a place from space, drop a pin, crack the GIS crossword."],
  ["Data drops", "fresh open datasets, ready to download."],
]

export const welcomeEmail = ({
  siteUrl, unsubscribeUrl, name, publishDay, publishTime, editorName, contactEmail,
}: {
  siteUrl: string
  unsubscribeUrl: string
  name: string
  publishDay: string
  publishTime: string
  editorName: string
  contactEmail: string
}) => {
  const first = name.trim().split(/\s+/)[0] || ""
  const subject = first ? `${first}, you're in. Welcome to GeoBriefing` : "You're in. Welcome to GeoBriefing"
  const host = siteUrl.replace(/^https?:\/\//, "")

  const rows = INCLUDES.map(([title, text], i) => `
<tr><td style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td width="36" valign="top" style="padding:13px 0;border-bottom:1px solid #dddcd5;font:bold 13px Arial,sans-serif;color:#1a6b3c">${String(i + 1).padStart(2, "0")}</td>
<td style="padding:13px 0;border-bottom:1px solid #dddcd5"><span style="font:bold 17px Georgia,serif;color:#1a1a1a">${esc(title)}</span><br><span style="font:14px/1.5 Arial,sans-serif;color:#4a4a45">${esc(text)}</span></td>
</tr></table></td></tr>`).join("")

  const favour = contactEmail
    ? `Drag this email into your main inbox, or add <b>${esc(contactEmail)}</b> to your contacts. Otherwise ${esc(publishDay)}'s issue may land in Promotions.`
    : `Drag this email into your main inbox. Otherwise ${esc(publishDay)}'s issue may land in Promotions.`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#e6e5df">
<div style="display:none;max-height:0;overflow:hidden">One email every ${esc(publishDay)}. Ten minutes. The whole map of the week.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#e6e5df"><tr><td align="center" style="padding:24px 8px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FAFAF7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<tr><td style="padding:24px 32px 0"><div style="border-top:4px solid #1a1a1a;height:3px;font-size:0;line-height:0">&nbsp;</div><div style="border-top:1px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td align="center" style="padding:18px 32px 14px;border-bottom:1px solid #1a1a1a">
<img src="${siteUrl}/email/wordmark@2x.png" width="280" height="56" alt="GeoBriefing" style="display:block;margin:0 auto;border:0;width:280px;max-width:100%;height:auto;font:bold 34px Georgia,serif;color:#1a1a1a">
<div style="font:bold 8px Arial,sans-serif;letter-spacing:4px;margin-top:10px;color:#1a1a1a">SPATIAL INTELLIGENCE · WEEKLY</div>
</td></tr>
<tr><td style="padding:40px 32px 0">
<h1 style="margin:0;font:bold 46px/1.02 Georgia,serif;color:#1a1a1a;letter-spacing:-0.5px">You&rsquo;re in${first ? `, ${esc(first)}` : ""}.</h1>
<p style="margin:16px 0 0;font:19px/1.55 Georgia,serif;color:#2b2b28">Every <b>${esc(publishDay)} at ${esc(publishTime)}</b>, one email lands here: the week&rsquo;s map of the world, in ten minutes. No fluff. No ads. Just the stories, data and maps worth your time.</p>
</td></tr>
<tr><td style="padding:28px 32px 6px"><div style="font:bold 10px Arial,sans-serif;letter-spacing:2px;color:#1a6b3c">WHAT&rsquo;S INSIDE EVERY ISSUE</div></td></tr>
${rows}
<tr><td style="padding:10px 32px 0;font:13px/1.5 Arial,sans-serif;color:#66665f">Plus events, comics, a quote and a joke you&rsquo;ll pretend not to like.</td></tr>
<tr><td style="padding:26px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td style="border-left:4px solid #1a6b3c;background:#f0f7f3;padding:16px 18px;font:15px/1.55 Arial,sans-serif;color:#2b2b28"><b style="color:#1a1a1a">Do this now (10 seconds):</b> ${favour}</td>
</tr></table></td></tr>
<tr><td style="padding:28px 32px 0">
<a href="${siteUrl}" style="display:inline-block;background:#1a1a1a;color:#FAFAF7;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:15px 22px">READ THE LATEST ISSUE &rarr;</a>
<a href="${siteUrl}/issues" style="display:inline-block;margin-left:14px;font:bold 12px Arial,sans-serif;letter-spacing:2px;color:#1a6b3c;text-decoration:none;padding:15px 0">BROWSE PAST ISSUES</a>
</td></tr>
<tr><td style="padding:34px 32px 0">
<p style="margin:0;font:17px/1.6 Georgia,serif;color:#2b2b28">One question while you&rsquo;re here: <b>what do you map?</b> Hit reply and tell me. I read every email, and the best answers shape what goes in.</p>
<p style="margin:12px 0 0;font:bold 15px Arial,sans-serif;color:#1a1a1a">${editorName ? esc(editorName) : "The editor"}</p>
<p style="margin:2px 0 0;font:13px Arial,sans-serif;color:#66665f">Editor, GeoBriefing</p>
</td></tr>
<tr><td align="center" style="padding:32px;font:12px/1.6 Arial,sans-serif;color:#66665f"><div style="border-top:1px solid #dddcd5;padding-top:16px">
GeoBriefing · Free weekly GIS intelligence · <a href="${siteUrl}" style="color:#66665f">${esc(host)}</a><br>
You signed up at ${esc(host)}. Not you? <a href="${unsubscribeUrl}" style="color:#66665f">Unsubscribe</a> in one click.
</div></td></tr>
</table>
</td></tr></table>
</body></html>`

  return { subject, html }
}
