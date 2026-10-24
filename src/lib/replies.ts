/** Helpers for inbound reader replies. */

const A = "A".charCodeAt(0)

/** English names of every country/region code the runtime knows, longest first. */
const COUNTRY_NAMES: string[] = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" })
  const out = new Set<string>()
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const code = String.fromCharCode(A + i, A + j)
      try {
        const name = names.of(code)
        if (name && name !== code) out.add(name)
      } catch { /* not a region code */ }
    }
  }
  // Common short forms readers type.
  ;["UAE", "USA", "UK", "Kyrgyzstan", "Turkey", "Ivory Coast", "Burma"].forEach(n => out.add(n))
  return [...out].sort((a, b) => b.length - a.length)
})()

/** Drops the quoted original message that mail clients append to replies. */
export const stripQuotedReply = (text: string) => {
  const lines = (text || "").replace(/\r/g, "").split("\n")
  const cut = lines.findIndex(l => /^On .+wrote:\s*$/.test(l.trim()) || /^-{2,}\s*Original Message/i.test(l.trim()) || /^From:\s/.test(l.trim()))
  const kept = (cut >= 0 ? lines.slice(0, cut) : lines).filter(l => !l.trim().startsWith(">"))
  return kept.join("\n").trim()
}

/** The first country name mentioned in a reply, as the reader's guess for next week's desk. */
export const parseGuess = (body: string): string | null => {
  const text = ` ${body.slice(0, 600)} `
  for (const name of COUNTRY_NAMES) {
    const re = new RegExp(`[^\\p{L}]${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\p{L}]`, "iu")
    if (re.test(text)) return name
  }
  return null
}
