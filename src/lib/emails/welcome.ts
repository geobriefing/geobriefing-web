/**
 * Welcome email. Table-based, 600px, Georgia and Arial only, inline styles.
 * The wordmark is a 2x PNG with "GeoBriefing" as its alt text.
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const P = "margin:0 0 16px;font:17px/1.6 Georgia,serif;color:#2b2b28"

export const welcomeEmail = ({
  siteUrl, unsubscribeUrl, name, nextIssueMonth, editorName, contactEmail,
}: {
  siteUrl: string
  unsubscribeUrl: string
  /** The subscriber's name as they typed it; the greeting uses the first word. */
  name: string
  /** e.g. "December": the first issue arrives on the 1st of it. */
  nextIssueMonth: string
  editorName: string
  contactEmail: string
}) => {
  const first = name.trim().split(/\s+/)[0] || ""
  const subject = "Welcome. Your map is this way."
  const host = siteUrl.replace(/^https?:\/\//, "")
  const contacts = contactEmail ? `add <b>${esc(contactEmail)}</b> to your contacts` : "add this address to your contacts"

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#e6e5df">
<div style="display:none;max-height:0;overflow:hidden">Maps, geography, spatial intelligence and the stories worth paying attention to. Once a month.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#e6e5df"><tr><td align="center" style="padding:24px 8px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FAFAF7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
<tr><td style="padding:24px 32px 0"><div style="border-top:4px solid #1a1a1a;height:3px;font-size:0;line-height:0">&nbsp;</div><div style="border-top:1px solid #1a1a1a;font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td align="center" style="padding:18px 32px 14px;border-bottom:1px solid #1a1a1a">
<img src="${siteUrl}/email/wordmark@2x.png" width="280" height="56" alt="GeoBriefing" style="display:block;margin:0 auto;border:0;width:280px;max-width:100%;height:auto;font:bold 34px Georgia,serif;color:#1a1a1a">
<div style="font:bold 8px Arial,sans-serif;letter-spacing:4px;margin-top:10px;color:#1a1a1a">SPATIAL INTELLIGENCE · MONTHLY</div>
</td></tr>
<tr><td style="padding:36px 32px 0">
<p style="${P}">${first ? `Hi ${esc(first)},` : "Hi there,"}</p>
<h1 style="margin:0 0 18px;font:bold 40px/1.05 Georgia,serif;color:#1a1a1a;letter-spacing:-0.5px">Welcome.</h1>
<p style="${P}">Once a month, you&rsquo;ll receive a new issue covering the geospatial world without attempting to cover <i>all</i> of the geospatial world.</p>
<p style="${P}">There&rsquo;ll be the stories that mattered, one deeper feature, remarkable maps, useful datasets, events worth knowing about and a Country Desk built partly from local-language reporting.</p>
<p style="${P}">There&rsquo;ll also be comics, geographical oddities and three games, because there is a limit to how seriously anyone should be expected to discuss coordinate systems.</p>
<p style="${P}">Each issue is edited before it reaches you. Automation helps find things. It doesn&rsquo;t get the final word.</p>
<p style="${P}">Your first issue arrives on the <b style="color:#1a1a1a">1st of ${esc(nextIssueMonth)}</b>.</p>
</td></tr>
<tr><td style="padding:4px 32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
<td style="border-left:4px solid #1a6b3c;background:#f0f7f3;padding:16px 18px;font:15px/1.55 Arial,sans-serif;color:#2b2b28"><b style="color:#1a1a1a">One small housekeeping request:</b> ${contacts} or move this email to your main inbox. Otherwise your email provider may decide that maps belong in Promotions.</td>
</tr></table></td></tr>
<tr><td style="padding:28px 32px 0">
<p style="${P}">See you on the 1st.</p>
<p style="margin:0;font:bold 16px Arial,sans-serif;color:#1a1a1a">${editorName ? esc(editorName) : "The editor"}</p>
<p style="margin:2px 0 0;font:14px Arial,sans-serif;color:#66665f">Editor, GeoBriefing</p>
</td></tr>
<tr><td style="padding:28px 32px 0">
<a href="${siteUrl}" style="display:inline-block;background:#1a1a1a;color:#FAFAF7;font:bold 12px Arial,sans-serif;letter-spacing:2px;text-decoration:none;padding:15px 22px">VISIT GEOBRIEFING &rarr;</a>
</td></tr>
<tr><td align="center" style="padding:32px;font:12px/1.6 Arial,sans-serif;color:#66665f"><div style="border-top:1px solid #dddcd5;padding-top:16px">
GeoBriefing · Read the world spatially. · <a href="${siteUrl}" style="color:#66665f">${esc(host)}</a><br>
You received this because you subscribed at ${esc(host)}. Not you? <a href="${unsubscribeUrl}" style="color:#66665f">Unsubscribe</a> in one click.
</div></td></tr>
</table>
</td></tr></table>
</body></html>`

  return { subject, html }
}
