"use client"
import { useState } from "react"

/** Copy link / LinkedIn / WhatsApp share row for the current page. */
const ShareLinks = ({ title }: { title: string }) => {
  const [copied, setCopied] = useState(false)

  const url = () => window.location.href.split("#")[0]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer")

  const cls = "min-h-11 sm:min-h-0 font-sans font-semibold text-[11.5px] tracking-meta uppercase text-accent hover:text-accent-deep cursor-pointer"

  return (
    <div className="flex flex-wrap gap-x-[18px] gap-y-2 mt-3 items-center">
      <span className="font-sans font-semibold text-[11.5px] tracking-meta uppercase text-meta">Share</span>
      <button type="button" onClick={copy} className={cls}>{copied ? "Copied" : "Copy link"}</button>
      <button type="button" className={cls}
        onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url())}`)}>
        LinkedIn
      </button>
      <button type="button" className={cls}
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`)}>
        WhatsApp
      </button>
    </div>
  )
}

export default ShareLinks
