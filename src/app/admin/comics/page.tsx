"use client"
import { useState, useEffect } from "react"
import AdminHeader from "@/components/AdminHeader"
import { AdminLoading, AdminTitle, BigBtn, Field, Notice, StatusText, inputCls } from "@/components/AdminUI"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"
import { formatDate } from "@/lib/format"

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

interface Strip {
  id: string
  title: string
  image_url: string | null
  status: string
  issue_number: number | null
  created_at: string
}

const ComicsAdminPage = () => {
  const { ready, logout } = useAdminAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [strips, setStrips] = useState<Strip[]>([])
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
    if (ready) loadData()
  }, [ready])

  const loadData = async () => {
    const [{ data: seriesData }, { data: issuesData }, { data: stripsData }] = await Promise.all([
      supabase.from("comic_series").select("*").order("title"),
      supabase.from("issues").select("id, issue_number, headline").order("issue_number", { ascending: false }),
      supabase.from("comic_strips").select("id, title, image_url, status, issue_number, created_at").order("created_at", { ascending: false }).limit(12),
    ])
    setSeries(seriesData || [])
    setIssues(issuesData || [])
    setStrips(stripsData || [])
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
        status: "draft",
        published_at: null,
      })
      if (dbError) throw dbError
      setMessage("Strip uploaded as a draft. Approve it in the Editor's Desk before the issue is published.")
      setTitle("")
      setScript("")
      setGisConcept("")
      setImageFile(null)
      setImagePreview("")
      loadData()
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const selectedSeriesData = series.find(s => s.id === selectedSeries)

  if (!ready) return <AdminLoading />

  return (
    <div className="min-h-screen">
      <AdminHeader active="comics" onLogout={logout} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">
        <div className="max-w-[720px]">
          <AdminTitle title="Comics" />
          <Notice message={message} />

          <div className="flex flex-col gap-5 mt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Series *">
                <select value={selectedSeries} onChange={e => setSelectedSeries(e.target.value)} className={inputCls}>
                  <option value="">Select series…</option>
                  {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </Field>
              <Field label="Issue *">
                <select value={selectedIssue} onChange={e => setSelectedIssue(e.target.value)} className={inputCls}>
                  <option value="">Select issue…</option>
                  {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number} · {i.headline.slice(0, 40)}</option>)}
                </select>
              </Field>
            </div>

            {selectedSeriesData && (
              <div className="border-l-[3px] border-accent bg-accent-tint px-4 py-3 font-sans text-sm text-ink-2">
                <b className="text-accent">Characters:</b> {selectedSeriesData.characters}
              </div>
            )}

            <Field label="Strip title *">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Datum Shift Disaster" className={inputCls} />
            </Field>

            <Field label="GIS concept">
              <input type="text" value={gisConcept} onChange={e => setGisConcept(e.target.value)} placeholder="e.g. Coordinate Reference Systems" className={inputCls} />
            </Field>

            <Field label="Script / panel descriptions">
              <textarea value={script} onChange={e => setScript(e.target.value)} placeholder={"Panel 1: ...\nPanel 2: ...\nPanel 3: ..."}
                rows={5} className={`${inputCls} resize-y`} />
            </Field>

            <Field label="Strip image *" hint="PNG or JPG · 1800px wide recommended">
              <label className="block border border-dashed border-[#B9B8B0] bg-card px-5 py-6 text-center font-sans text-sm text-ink-3 cursor-pointer hover:border-accent">
                {imageFile ? imageFile.name : "Choose a PNG or JPG"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
              </label>
            </Field>
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img loading="lazy" src={imagePreview} alt="Preview" className="w-full border border-hair" />
            )}

            <BigBtn onClick={handleUpload} disabled={uploading} className="self-start">
              {uploading ? "Uploading…" : "+ Upload strip"}
            </BigBtn>
          </div>

          {strips.length > 0 && (
            <div className="mt-10">
              <div className="font-sans font-bold text-label tracking-label uppercase text-accent pb-2 border-b border-ink">Recent strips</div>
              {strips.map(s => (
                <div key={s.id} className="grid grid-cols-[96px_minmax(0,1fr)_auto] sm:grid-cols-[120px_minmax(0,1fr)_auto] gap-3.5 items-center py-3 border-b border-hair">
                  {s.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img loading="lazy" src={s.image_url} alt="" className="w-full aspect-[3/1] object-cover border border-hair" />
                  ) : <div className="aspect-[3/1] hatch border border-hair" />}
                  <div>
                    <div className="font-display font-semibold text-[15px]">{s.title}</div>
                    <div className="font-sans text-[12.5px] text-meta">
                      Uploaded {formatDate(s.created_at, "dayMonth")}{s.issue_number ? ` · Issue #${s.issue_number}` : ""}
                    </div>
                  </div>
                  <StatusText status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ComicsAdminPage
