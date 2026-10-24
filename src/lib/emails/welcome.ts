/**
 * Welcome email. Table-based, 600px, Georgia and Arial only, inline styles.
 * The wordmark is a 2x PNG with "GeoBriefing" as its alt text.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const INCLUDES: [string, string][] = [
  ["The week's GIS news", "from South Asia, the Middle East, Central Asia and beyond"],
  ["One longer story", "about people doing interesting work with maps"],
  ["Maps Don't Lie", "a map worth arguing about"],
  ["Comics", "the GIS office, drawn"],
  ["Games", "Satellite Spot, GeoGuesser and a crossword"],
  ["Events", "the dates worth knowing about"],
]

export const welcomeEmail = ({
  siteUrl, unsubscribeUrl, publishDay, editorName, contactEmail,
}: {
  siteUrl: string
  unsubscribeUrl: string
  publishDay: string
  editorName: string
  contactEmail: string
}) => {
  const rows = INCLUDES.map(([title, text], i) => `
<tr><td style="padding:0 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td width="32" valign="top" style="padding:12px 0;border-bottom:1px solid #dddcd5;font:bold 12px Arial,sans-serif;color:#1a6b3c">${String(i + 1).padStart(2, "0")}</td>
<td style="padding:12px 0;border-bottom:1px solid #dddcd5"><span style="font:bold 16px Georgia,serif;color:#1a1a1a">${esc(title)}</span> <span style="font:14px Arial,sans-serif;color:#4a4a45">— ${esc(text)}</span></td>
</tr></table></td></tr>`).join("")

  const favour = contactEmail
    ? `move this email to your main inbox, or add ${esc(contactEmail)} to your contacts, so ${esc(publishDay)}'s issue doesn't end up in Promotions.`
    : `move this email to your main inbox so ${esc(publishDay)}'s issue doesn't end up in Promotions.`

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to GeoBriefing</title></head>
<body style="margin:0;padding:0;background:#e6e5df">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#e6e5df"><tr><td align="center" style="padding:24px 8px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FAFAF7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<tr><td style="padding:24px 32px 0"><div style="border-top:4px solid #1a1a1a;height:3px;font-size:0;line-height:0">&nbsp;</div><div style="border-top:1px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td align="center" style="padding:18px 32px 14px;border-bottom:1px solid #1a1a1a">
<img src="${siteUrl}/email/wordmark@2x.png" width="280" height="56" alt="GeoBriefing" style="display:block;margin:0 auto;border:0;width:280px;max-width:100%;height:auto;font:bold 34px Georgia,serif;color:#1a1a1a">
<div style="font:bold 8px Arial,sans-serif;letter-spacing:4px;margin-top:10px;color:#1a1a1a">SPATIAL INTELLIGENCE · WEEKLY</div>
</td></tr>
<tr><td style="padding:36px 32px 0">
<h1 style="margin:0;font:bold 40px/1.05 Georgia,serif;color:#1a1a1a">You are in.</h1>
<p style="margin:14px 0 0;font:18px/1.6 Georgia,serif;color:#2b2b28">Thanks for subscribing. Your first issue arrives on ${esc(publishDay)} afternoon. Each one has:</p>
</td></tr>
${rows}
<tr><td style="padding:24px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td style="border-left:3px solid #1a6b3c;background:#f0f7f3;padding:14px 16px;font:15px/1.55 Arial,sans-serif;color:#2b2b28"><b>One small favour:</b> ${favour}</td>
</tr></table></td></tr>
<tr><td style="padding:24px 32px 0"><a href="${siteUrl}" style="display:inline-block;background:#1a1a1a;color:#FAFAF7;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:14px 20px">READ THIS WEEK'S ISSUE &rarr;</a></td></tr>
<tr><td style="padding:32px 32px 0">
<p style="margin:0;font:16px/1.6 Georgia,serif;color:#2b2b28">Reply to this email any time. I read every one.</p>
<p style="margin:10px 0 0;font:15px Arial,sans-serif;color:#66665f">— ${editorName ? esc(editorName) : "The editor"}</p>
</td></tr>
<tr><td align="center" style="padding:32px;font:12px/1.6 Arial,sans-serif;color:#66665f"><div style="border-top:1px solid #dddcd5;padding-top:16px">
GeoBriefing · Free weekly GIS intelligence<br>
<a href="${unsubscribeUrl}" style="color:#66665f">Unsubscribe</a>
</div></td></tr>
</table>
</td></tr></table>
</body></html>`
}
