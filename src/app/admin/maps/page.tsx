"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Logo from "@/components/Logo"
import { supabaseAdmin as supabase } from "@/lib/supabase"

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

export default function MapsAdminPage() {
  const router = useRouter()
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
    if (typeof window !== "undefined" && !localStorage.getItem("gb_admin")) {
      router.push("/admin")
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    const { data: issuesData } = await supabase.from("issues").select("id, issue_number, headline").order("issue_number", { ascending: false })
    const { data: draftsData } = await supabase.from("maps_dont_lie").select("*").order("created_at", { ascending: false })
    setIssues(issuesData || [])
    setDrafts(draftsData || [])
  }

  const handleLogout = () => {
    localStorage.removeItem("gb_admin")
    router.push("/admin")
  }

  const handleDraftImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setNewImagePreview(reader.result as string)
    reader.readAsDataURL(file)
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
        status: "published",
      }).eq("id", editingDraft.id)
      if (error) throw error
      setMessage("Map published!")
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
      setMessage("Title, commentary and issue are required.")
      return
    }
    setUploading(true)
    setMessage("")
    try {
      let imageUrl = null
      if (newImageFile) imageUrl = await uploadImage(newImageFile, "map-new")
      const { error } = await supabase.from("maps_dont_lie").insert({ ...newMap, image_url: imageUrl, status: "published" })
      if (error) throw error
      setMessage("Map published!")
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <header className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-sans tracking-widest text-gray-500 uppercase">Admin · Maps Don&apos;t Lie</span>
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
        <Link href="/admin/comics" className="text-gray-500 hover:text-[#1a1a1a]">Comics</Link>
        <Link href="/admin/maps" className="text-[#1a6b3c] font-bold">Maps</Link>
        <Link href="/admin/content" className="text-gray-500 hover:text-[#1a1a1a]">Content</Link>
        <Link href="/admin/settings" className="text-gray-500 hover:text-[#1a1a1a]">Settings</Link>
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">View site</Link>
        <button onClick={handleLogout} className="text-red-400 hover:text-red-600 font-bold ml-auto">Logout</button>
      </nav>

      {message && (
        <div className={`mb-6 px-4 py-3 text-sm font-sans border ${
          message.startsWith("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
        }`}>
          {message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500">
          All Maps ({drafts.length})
        </h2>
        <button onClick={() => setShowNewForm(!showNewForm)}
          className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a6b3c] hover:underline">
          + Add new map
        </button>
      </div>

      {showNewForm && (
        <div className="border border-[#1a6b3c] p-5 mb-8 flex flex-col gap-4">
          <h3 className="text-sm font-bold">New Map Entry</h3>
          <select value={newMap.issue_id} onChange={e => setNewMap({ ...newMap, issue_id: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
            <option value="">Select issue *</option>
            {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number}</option>)}
          </select>
          <input type="text" value={newMap.title} onChange={e => setNewMap({ ...newMap, title: e.target.value })}
            placeholder="Map title *"
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
          <select value={newMap.map_type} onChange={e => setNewMap({ ...newMap, map_type: e.target.value })}
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
            <option value="misleading">Misleading</option>
            <option value="surprising">Surprising</option>
            <option value="manipulative">Manipulative</option>
            <option value="historical">Historical</option>
          </select>
          <textarea value={newMap.commentary} onChange={e => setNewMap({ ...newMap, commentary: e.target.value })}
            placeholder="Your editorial commentary *" rows={5}
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none" />
          <input type="url" value={newMap.source_url} onChange={e => setNewMap({ ...newMap, source_url: e.target.value })}
            placeholder="Source URL"
            className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleNewImageChange}
            className="w-full text-sm font-sans border border-gray-300 px-3 py-2 cursor-pointer" />
          {newImagePreview && <img src={newImagePreview} alt="Preview" className="w-full border border-gray-200" />}
          <button onClick={publishNewMap} disabled={uploading}
            className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-2 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50">
            {uploading ? "Publishing..." : "Publish Map"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {drafts.map(draft => (
          <div key={draft.id} className={`border p-4 ${draft.status === "published" ? "border-gray-200" : "border-amber-200 bg-amber-50"}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-sans font-bold px-2 py-0.5 rounded ${
                  draft.status === "published" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {draft.status}
                </span>
                <span className="text-xs font-sans text-gray-400">{draft.map_type}</span>
              </div>
              <div className="flex gap-3">
                {draft.status === "draft" && (
                  <button onClick={() => { setEditingDraft({ ...draft }); setImagePreview(""); setImageFile(null) }}
                    className="text-xs font-sans text-[#1a6b3c] font-bold hover:underline">
                    Edit + Publish
                  </button>
                )}
                <button onClick={() => deleteMap(draft.id)} className="text-xs font-sans text-red-400 hover:underline">Delete</button>
              </div>
            </div>
            <h3 className="font-bold mb-1 text-sm">{draft.title}</h3>
            <p className="text-xs font-sans text-gray-500 leading-relaxed mb-2 line-clamp-2">{draft.commentary}</p>
            {draft.source_url && (
              <a href={draft.source_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-sans text-[#1a6b3c] hover:underline break-all">
                {draft.source_url.slice(0, 60)}...
              </a>
            )}
            {draft.image_url && (
              <img src={draft.image_url} alt={draft.title} className="w-full max-h-40 object-cover border border-gray-200 mt-2" />
            )}
          </div>
        ))}
      </div>

      {editingDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-2xl w-full max-h-screen overflow-y-auto p-6 font-serif">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Edit + Publish Map</h2>
              <button onClick={() => setEditingDraft(null)} className="text-gray-400 hover:text-[#1a1a1a] text-xl font-bold">×</button>
            </div>
            <div className="flex flex-col gap-4">
              <input type="text" value={editingDraft.title} onChange={e => setEditingDraft({ ...editingDraft, title: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Title" />
              <select value={editingDraft.map_type} onChange={e => setEditingDraft({ ...editingDraft, map_type: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none bg-white">
                <option value="misleading">Misleading</option>
                <option value="surprising">Surprising</option>
                <option value="manipulative">Manipulative</option>
                <option value="historical">Historical</option>
              </select>
              <textarea value={editingDraft.commentary} onChange={e => setEditingDraft({ ...editingDraft, commentary: e.target.value })}
                rows={7} className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none resize-none leading-relaxed"
                placeholder="Editorial commentary..." />
              <input type="url" value={editingDraft.source_url || ""} onChange={e => setEditingDraft({ ...editingDraft, source_url: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none" placeholder="Source URL" />
              {editingDraft.source_url && (
                <div className="text-xs font-sans bg-gray-50 p-3 border border-gray-200">
                  Find the map at: <a href={editingDraft.source_url} target="_blank" rel="noopener noreferrer"
                    className="text-[#1a6b3c] hover:underline">{editingDraft.source_url}</a>
                </div>
              )}
              <div>
                <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Upload Map Image</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleDraftImageChange}
                  className="w-full text-sm font-sans border border-gray-300 px-3 py-2 cursor-pointer" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full border border-gray-200" />}
              </div>
              <button onClick={publishDraft} disabled={uploading}
                className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-3 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50">
                {uploading ? "Publishing..." : "Publish Map"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
