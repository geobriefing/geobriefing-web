"use client"
import { useState } from "react"
import Link from "next/link"
import Header from "@/components/Header"

const SubscribePage = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email.")
      setStatus("error")
      return
    }
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()

      if (res.status === 409 || data.error === "already_subscribed") {
        setMessage("You are already subscribed.")
        setStatus("error")
        return
      }

      if (!res.ok) {
        setMessage("Something went wrong. Please try again.")
        setStatus("error")
        return
      }

      setStatus("success")
      setName("")
      setEmail("")

    } catch {
      setMessage("Something went wrong. Please try again.")
      setStatus("error")
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-serif">

      <Header active="subscribe" topLeftLabel="Subscribe" />

      <div className="border-t-2 border-[#1a1a1a] pt-8 mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Subscribe to GeoBriefing</h1>
        <p className="text-sm font-sans text-gray-600 leading-relaxed mb-2">
          GeoBriefing is a free weekly GIS intelligence publication. Every Monday: curated
          news, original stories, games, comics, maps, events, and jobs — with a focus on
          South Asia, the Middle East, and Central Asia.
        </p>
        <p className="text-sm font-sans text-gray-600 leading-relaxed">
          Free. Independent. No ads. No spam.
        </p>
      </div>

      {status === "success" ? (
        <div className="border border-[#1a6b3c] bg-emerald-50 p-6 sm:p-8 text-center mb-10">
          <p className="text-lg font-bold mb-2">You are in.</p>
          <p className="text-sm font-sans text-gray-600 mb-4">
            Welcome to GeoBriefing. Check your inbox for a confirmation.
            Your first issue arrives next Monday.
          </p>
          <Link href="/"
            className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
            Read the latest issue →
          </Link>
        </div>
      ) : (
        <div className="border border-gray-300 p-4 sm:p-6 mb-10">
          <div className="flex flex-col gap-3 mb-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]"
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubscribe()}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]"
            />
          </div>
          {message && (
            <p className={`text-xs font-sans mb-3 ${status === "error" ? "text-red-500" : "text-green-600"}`}>
              {message}
            </p>
          )}
          <button
            onClick={handleSubscribe}
            disabled={status === "loading"}
            className="w-full bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-3 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe free"}
          </button>
          <p className="text-xs font-sans text-gray-400 mt-3 text-center">
            No spam. No ads. Unsubscribe any time.
          </p>
        </div>
      )}

      <div className="border-t border-gray-200 pt-8 mb-10">
        <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-5">
          What you get every Monday
        </h2>
        <div className="flex flex-col gap-3">
          {[
            ["GIS News Digest", "Curated from RSS feeds, arXiv research, Medium, and Reddit r/gis — scored by AI, reviewed by a human."],
            ["GIS Story", "One longform story per issue — historical cartography, bizarre true stories, unsung heroes of geospatial."],
            ["Maps Don't Lie", "One map per week that misleads, surprises, or reveals something uncomfortable about how we see the world."],
            ["Comic Strips", "Five original recurring comic series — same characters, new GIS disasters every week."],
            ["Games", "Satellite Spot, GeoGuesser, and a GIS crossword — generated fresh each issue."],
            ["GIS Jokes + Fun Facts", "Because topology errors are funnier than you think."],
            ["Upcoming Events", "GIS conferences, webinars, hackathons — curated and upcoming."],
            ["GIS Jobs", "Pakistan and international opportunities, updated weekly."],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-[#1a6b3c] font-bold mt-0.5 flex-shrink-0">·</span>
              <div>
                <span className="text-sm font-bold">{title}</span>
                <span className="text-sm font-sans text-gray-500"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-[#1a1a1a] pt-6 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center">
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">
          Read the latest issue first →
        </Link>
        <Link href="/about" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">About</Link>
      </div>

    </div>
  )
}

export default SubscribePage