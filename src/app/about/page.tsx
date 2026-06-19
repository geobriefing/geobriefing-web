import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Header from "@/components/Header"

export default async function AboutPage() {
  const { data: settingsData } = await supabase
    .from("site_settings")
    .select("id, value")

  const settings: Record<string, string> = {}
  if (settingsData) {
    settingsData.forEach((s: { id: string; value: string }) => {
      settings[s.id] = s.value
    })
  }

  const editorName = settings["editor_name"] || "Aneeqa Abrar"
  const editorBio = settings["editor_bio"] || ""
  const editorMission = settings["editor_mission"] || ""
  const editorContact = settings["editor_contact"] || "hello@geobriefing.com"
  const editorPhotoUrl = settings["editor_photo_url"] || ""

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-serif">

      <Header active="about" topLeftLabel="About" />

      <div className="border-t-2 border-[#1a1a1a] pt-8 mb-10">
        <p className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-3">The editor</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{editorName}</h1>

        <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start">
          {editorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={editorPhotoUrl}
              alt={editorName}
              className="w-28 h-28 object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-28 h-28 bg-gray-100 border border-dashed border-gray-300 flex-shrink-0 flex items-center justify-center">
              <span className="text-xs font-sans text-gray-400 text-center px-2">Photo</span>
            </div>
          )}
          <div className="flex flex-col gap-4 text-sm font-sans text-gray-700 leading-relaxed">
            {editorBio && <p>{editorBio}</p>}
            {editorMission && <p>{editorMission}</p>}
            <p>Every issue is a mix of human editorial judgment and AI assistance. Groq&apos;s Llama model scrapes and scores hundreds of stories each week. The editor reads, edits, rewrites, and decides what matters. The comic scripts are written by hand. The editorial voice is entirely human.</p>
            <p>GeoBriefing is free, independent, and has no advertisers.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8 mb-10">
        <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-5">About this publication</h2>
        <div className="flex flex-col gap-4 text-sm font-sans text-gray-700 leading-relaxed">
          <p>GeoBriefing publishes every Monday. Each issue contains a curated news digest, original GIS stories, a Maps Don&apos;t Lie section, five recurring comic strips, interactive games, upcoming events, job listings, jokes, fun facts, and a weekly quote from someone who thinks seriously about maps.</p>
          <p>The scraper collects stories from RSS feeds, Medium, arXiv, and Reddit r/gis. Everything is tagged and scored by AI. Nothing publishes without human review.</p>
          <p>GeoBriefing is built on Next.js, Supabase, and Groq.</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8 mb-10">
        <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 mb-4">Contact</h2>
        <p className="text-sm font-sans text-gray-700">
          Feedback, story tips, job listings, and comic strip ideas welcome at{" "}
          <a href={`mailto:${editorContact}`} className="text-[#1a6b3c] hover:underline break-all">
            {editorContact}
          </a>
        </p>
      </div>

      <div className="border-t-2 border-[#1a1a1a] pt-6 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between sm:items-center">
        <Link href="/subscribe"
          className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
          Subscribe free →
        </Link>
        <Link href="/" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">Latest issue</Link>
      </div>

    </div>
  )
}