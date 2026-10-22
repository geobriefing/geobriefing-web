"use client"
import { useState, useEffect } from "react"
import AdminHeader from "@/components/AdminHeader"
import { TypePill } from "@/components/Pills"
import { AdminLoading, AdminTitle, BigBtn, Btn, Field, Notice, StatusText, inputCls } from "@/components/AdminUI"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"

interface Issue {
  id: string
  issue_number: number
  headline: string
}

interface MapDraft {
  id: string
  title: string
  commentary: string
  map_type: string
  source_url: string | null
  image_url: string | null
  status: string
  issue_id: string | null
}

const MAP_TYPES = ["misleading", "surprising", "manipulative", "beautiful", "historical"]

const ImagePicker = ({ file, onChange }: { file: File | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <label className="block border border-dashed border-[#B9B8B0] bg-card px-5 py-5 text-center font-sans text-sm text-ink-3 cursor-pointer hover:border-accent">
    {file ? file.name : "Choose a map image (PNG, JPG or WebP)"}
    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onChange} className="sr-only" />
  </label>
)

const MapsAdminPage = () => {
  const { ready, logout } = useAdminAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [drafts, setDrafts] = useState<MapDraft[]>([])
  const [editingDraft, setEditingDraft] = useState<MapDraft | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const [newMap, setNewMap] = useState({ title: "", commentary: "", map_type: "misleading", source_url: "", issue_id: "" })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState("")

  useEffect(() => {
    if (ready) loadData()
  }, [ready])

  const loadData = async () => {
    const { data: issuesData } = await supabase.from("issues").select("id, issue_number, headline").order("issue_number", { ascending: false })
    const { data: draftsData } = await supabase.from("maps_dont_lie").select("*").order("created_at", { ascending: false })
    setIssues(issuesData || [])
    setDrafts(draftsData || [])
  }

  const readPreview = (file: File, set: (s: string) => void) => {
    const reader = new FileReader()
    reader.onload = () => set(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDraftImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    readPreview(file, setImagePreview)
  }

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImageFile(file)
    readPreview(file, setNewImagePreview)
  }

  const uploadImage = async (file: File, prefix: string) => {
    const fileName = `${prefix}-${Date.now()}.${file.name.split(".").pop()}`
    const { error } = await supabase.storage.from("maps").upload(fileName, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from("maps").getPublicUrl(fileName).data.publicUrl
  }

  const publishDraft = async () => {
    if (!editingDraft) return
    setUploading(true)
    setMessage("")
    try {
      let imageUrl = editingDraft.image_url
      if (imageFile) imageUrl = await uploadImage(imageFile, `map-${editingDraft.id}`)
      const { error } = await supabase.from("maps_dont_lie").update({
        title: editingDraft.title,
        commentary: editingDraft.commentary,
        map_type: editingDraft.map_type,
        source_url: editingDraft.source_url,
        image_url: imageUrl,
        status: "approved",
      }).eq("id", editingDraft.id)
      if (error) throw error
      setMessage("Map approved.")
      setEditingDraft(null)
      setImageFile(null)
      setImagePreview("")
      loadData()
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const publishNewMap = async () => {
    if (!newMap.title || !newMap.commentary || !newMap.issue_id) {
      setMessage("Please add a title, commentary and issue.")
      return
    }
    setUploading(true)
    setMessage("")
    try {
      let imageUrl = null
      if (newImageFile) imageUrl = await uploadImage(newImageFile, "map-new")
      const { error } = await supabase.from("maps_dont_lie").insert({ ...newMap, image_url: imageUrl, status: "approved" })
      if (error) throw error
      setMessage("Map approved.")
      setNewMap({ title: "", commentary: "", map_type: "misleading", source_url: "", issue_id: "" })
      setNewImageFile(null)
      setNewImagePreview("")
      setShowNewForm(false)
      loadData()
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const deleteMap = async (id: string) => {
    await supabase.from("maps_dont_lie").delete().eq("id", id)
    setMessage("Deleted.")
    loadData()
  }

  if (!ready) return <AdminLoading />

  const issueNumber = (id: string | null) => issues.find(i => i.id === id)?.issue_number

  return (
    <div className="min-h-screen">
      <AdminHeader active="maps" onLogout={logout} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">
        <div className="max-w-[820px]">
          <AdminTitle title="Maps Don't Lie" action={
            <Btn variant="primary" onClick={() => setShowNewForm(!showNewForm)}>{showNewForm ? "Close" : "+ New map"}</Btn>
          } />
          <Notice message={message} />

          {showNewForm && (
            <div className="bg-card border border-hair border-l-[3px] border-l-accent px-5 py-5 mt-5 flex flex-col gap-4">
              <div className="font-display font-bold text-h3">New map</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Issue *">
                  <select value={newMap.issue_id} onChange={e => setNewMap({ ...newMap, issue_id: e.target.value })} className={inputCls}>
                    <option value="">Select issue…</option>
                    {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number}</option>)}
                  </select>
                </Field>
                <Field label="Type">
                  <select value={newMap.map_type} onChange={e => setNewMap({ ...newMap, map_type: e.target.value })} className={`${inputCls} capitalize`}>
                    {MAP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Title *">
                <input type="text" value={newMap.title} onChange={e => setNewMap({ ...newMap, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Commentary *">
                <textarea value={newMap.commentary} onChange={e => setNewMap({ ...newMap, commentary: e.target.value })} rows={5} className={`${inputCls} resize-y`} />
              </Field>
              <Field label="Source URL">
                <input type="url" value={newMap.source_url} onChange={e => setNewMap({ ...newMap, source_url: e.target.value })} className={inputCls} />
              </Field>
              <ImagePicker file={newImageFile} onChange={handleNewImageChange} />
              {newImagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={newImagePreview} alt="Preview" className="w-full border border-hair" />
              )}
              <BigBtn onClick={publishNewMap} disabled={uploading} className="self-start">
                {uploading ? "Saving…" : "Approve map"}
              </BigBtn>
            </div>
          )}

          {drafts.length === 0 && !showNewForm && (
            <div className="mt-5 border border-dashed border-[#B9B8B0] bg-card px-6 py-10 text-center font-sans text-[15px] text-ink-3">
              No maps yet. The weekly pipeline suggests one, or add your own.
            </div>
          )}

          {drafts.map(draft => (
            <div key={draft.id} className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[96px_minmax(0,1fr)_auto] gap-x-3.5 gap-y-3 items-start py-3.5 border-b border-hair">
              {draft.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={draft.image_url} alt="" className="w-full aspect-[4/3] object-cover border border-hair" />
              ) : <div className="aspect-[4/3] hatch border border-hair" />}
              <div className="min-w-0">
                <div className="font-display font-semibold text-base leading-[1.3]">{draft.title}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <TypePill kind="map" value={draft.map_type} />
                  <StatusText status={draft.status} />
                  <span className="font-sans text-xs text-meta">{issueNumber(draft.issue_id) ? `#${issueNumber(draft.issue_id)}` : "Unused"}</span>
                </div>
                <p className="font-sans text-[13.5px] leading-[1.5] text-ink-3 mt-1.5 line-clamp-2">{draft.commentary}</p>
              </div>
              <div className="col-start-2 sm:col-start-auto flex gap-2">
                {draft.status !== "approved" && (
                  <Btn variant="approve" onClick={() => { setEditingDraft({ ...draft }); setImagePreview(""); setImageFile(null) }}>Edit + approve</Btn>
                )}
                <Btn variant="danger" onClick={() => deleteMap(draft.id)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingDraft && (
        <div className="fixed inset-0 bg-[#1A1A1A]/60 flex items-center justify-center z-50 p-2 sm:p-4" role="dialog" aria-modal="true">
          <div className="bg-paper border-t-[3px] border-ink max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7">
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b-2 border-ink">
              <h2 className="font-display font-bold text-[22px]">Edit and approve map</h2>
              <button type="button" onClick={() => setEditingDraft(null)} aria-label="Close" className="font-sans text-2xl leading-none text-meta hover:text-ink cursor-pointer">×</button>
            </div>
            <div className="flex flex-col gap-4">
              <Field label="Title">
                <input type="text" value={editingDraft.title} onChange={e => setEditingDraft({ ...editingDraft, title: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Type">
                <select value={editingDraft.map_type} onChange={e => setEditingDraft({ ...editingDraft, map_type: e.target.value })} className={`${inputCls} capitalize`}>
                  {MAP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Commentary">
                <textarea value={editingDraft.commentary} onChange={e => setEditingDraft({ ...editingDraft, commentary: e.target.value })} rows={7} className={`${inputCls} resize-y`} />
              </Field>
              <Field label="Source URL">
                <input type="url" value={editingDraft.source_url || ""} onChange={e => setEditingDraft({ ...editingDraft, source_url: e.target.value })} className={inputCls} />
              </Field>
              {editingDraft.source_url && (
                <div className="font-sans text-[13px] bg-paper-2 px-3 py-2.5 break-all text-ink-3">
                  Find the map at: <a href={editingDraft.source_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-deep">{editingDraft.source_url}</a>
                </div>
              )}
              <ImagePicker file={imageFile} onChange={handleDraftImageChange} />
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={imagePreview} alt="Preview" className="w-full border border-hair" />
              )}
              <BigBtn onClick={publishDraft} disabled={uploading} className="self-start">
                {uploading ? "Saving…" : "Approve map"}
              </BigBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapsAdminPage
