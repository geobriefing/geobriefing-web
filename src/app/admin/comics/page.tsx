"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Logo from "@/components/Logo"
import { supabaseAdmin as supabase } from "@/lib/supabase"

interface Series {
  id: string
  title: string
  characters: string
}

interface Issue {
  id: string
  issue_number: number
  headline: string
}

export default function ComicsAdminPage() {
  const router = useRouter()
  const [series, setSeries] = useState<Series[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedSeries, setSelectedSeries] = useState("")
  const [selectedIssue, setSelectedIssue] = useState("")
  const [title, setTitle] = useState("")
  const [script, setScript] = useState("")
  const [gisConcept, setGisConcept] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("gb_admin")) {
      router.push("/admin")
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    const { data: seriesData } = await supabase.from("comic_series").select("*").order("title")
    const { data: issuesData } = await supabase.from("issues").select("id, issue_number, headline").order("issue_number", { ascending: false })
    setSeries(seriesData || [])
    setIssues(issuesData || [])
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedSeries || !selectedIssue || !title || !imageFile) {
      setMessage("Please fill in all required fields and select an image.")
      return
    }
    setUploading(true)
    setMessage("")
    try {
      const issue = issues.find(i => i.id === selectedIssue)
      const fileName = `issue-${issue?.issue_number}-${selectedSeries.slice(0, 10)}-${Date.now()}.${imageFile.name.split(".").pop()}`
      const { error: uploadError } = await supabase.storage.from("comics").upload(fileName, imageFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("comics").getPublicUrl(fileName)
      const { error: dbError } = await supabase.from("comic_strips").insert({
        series_id: selectedSeries,
        issue_id: selectedIssue,
        title,
        script,
        image_url: urlData.publicUrl,
        issue_number: issue?.issue_number,
        published_at: new Date().toISOString(),
      })
      if (dbError) throw dbError
      setMessage("Comic strip uploaded successfully!")
      setTitle("")
      setScript("")
      setGisConcept("")
      setImageFile(null)
      setImagePreview("")
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("gb_admin")
    router.push("/admin")
  }

  const selectedSeriesData = series.find(s => s.id === selectedSeries)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">Admin · Comics</span>
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">geobriefing.com</span>
        </div>
        <div className="flex items-center justify-center gap-6 py-4 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Link href="/"><Logo size="lg" /></Link>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-sans text-gray-500">South Asia · Middle East · Central Asia · Global</span>
          <span className="text-xs font-sans text-gray-500">Free weekly · GIS intelligence</span>
        </div>
      </header>

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase">
        <Link href="/admin/comics" className="text-[#1a6b3c] font-bold">Comics</Link>
        <Link href="/admin/maps" className="text-gray-500 hover:text-[#1a1a1a]">Maps</Link>
        <Link href="/admin/content" className="text-gray-500 hover:text-[#1a1a1a]">Content</Link>
        <Link href="/admin/settings" className="text-gray-500 hover:text-[#1a1a1a]">Settings</Link>
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">View site</Link>
        <button onClick={handleLogout} className="text-red-400 hover:text-red-600 font-bold ml-auto">Logout</button>
      </nav>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Series *</label>
            <select value={selectedSeries} onChange={e => setSelectedSeries(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
              <option value="">Select series...</option>
              {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Issue *</label>
            <select value={selectedIssue} onChange={e => setSelectedIssue(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
              <option value="">Select issue...</option>
              {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number} — {i.headline.slice(0, 40)}</option>)}
            </select>
          </div>
        </div>

        {selectedSeriesData && (
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-sans text-gray-600">
            <span className="font-bold text-[#1a6b3c]">Characters:</span> {selectedSeriesData.characters}
          </div>
        )}

        <div>
          <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Strip Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. The Datum Shift Disaster"
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
        </div>

        <div>
          <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">GIS Concept</label>
          <input type="text" value={gisConcept} onChange={e => setGisConcept(e.target.value)}
            placeholder="e.g. Coordinate Reference Systems"
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
        </div>

        <div>
          <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Script / Panel Descriptions</label>
          <textarea value={script} onChange={e => setScript(e.target.value)}
            placeholder={"Panel 1: ...\nPanel 2: ...\nPanel 3: ..."}
            rows={5} className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none" />
        </div>

        <div>
          <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Comic Image * (PNG or JPG)</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange}
            className="w-full text-sm font-sans border border-gray-300 px-3 py-2 cursor-pointer" />
          {imagePreview && (
            <div className="mt-3">
              <p className="text-xs font-sans text-gray-400 mb-2">Preview:</p>
              <img src={imagePreview} alt="Preview" className="w-full border border-gray-200" />
            </div>
          )}
        </div>

        {message && (
          <div className={`px-4 py-3 text-sm font-sans border ${
            message.includes("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
          }`}>
            {message}
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading}
          className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-3 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50">
          {uploading ? "Uploading..." : "Upload Comic Strip"}
        </button>
      </div>
    </div>
  )
}
