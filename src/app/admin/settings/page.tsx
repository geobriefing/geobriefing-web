"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import AdminHeader from "@/components/AdminHeader"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"

const SettingsAdminPage = () => {
  const { ready, logout } = useAdminAuth()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [currentPhoto, setCurrentPhoto] = useState("")
  const [uploading, setUploading] = useState(false)
  const [photoMessage, setPhotoMessage] = useState("")
  const [editorName, setEditorName] = useState("")
  const [editorBio, setEditorBio] = useState("")
  const [editorMission, setEditorMission] = useState("")
  const [editorContact, setEditorContact] = useState("")
  const [aboutMessage, setAboutMessage] = useState("")
  const [savingAbout, setSavingAbout] = useState(false)
  const [tab, setTab] = useState<"photo" | "about">("photo")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ready) loadSettings()
  }, [ready])

  const loadSettings = async () => {
    const { data } = await supabase.from("site_settings").select("id, value")
    if (data) {
      const s: Record<string, string> = {}
      data.forEach((row: { id: string; value: string }) => { s[row.id] = row.value })
      setEditorName(s["editor_name"] || "")
      setEditorBio(s["editor_bio"] || "")
      setEditorMission(s["editor_mission"] || "")
      setEditorContact(s["editor_contact"] || "")
      setCurrentPhoto(s["editor_photo_url"] || "")
    }
    setLoading(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handlePhotoUpload = async () => {
    if (!imageFile) { setPhotoMessage("Please select a photo first."); return }
    setUploading(true)
    setPhotoMessage("")
    try {
      const ext = imageFile.name.split(".").pop()
      const fileName = `profile.${ext}`
      const { error: uploadError } = await supabase.storage.from("editor").upload(fileName, imageFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from("editor").getPublicUrl(fileName)
      const photoUrl = urlData.publicUrl
      await supabase.from("site_settings").upsert({ id: "editor_photo_url", value: photoUrl })
      setCurrentPhoto(photoUrl)
      setImageFile(null)
      setImagePreview("")
      setPhotoMessage("Photo uploaded and saved!")
    } catch (err: unknown) {
      setPhotoMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveAbout = async () => {
    setSavingAbout(true)
    setAboutMessage("")
    try {
      await Promise.all([
        supabase.from("site_settings").upsert({ id: "editor_name", value: editorName }),
        supabase.from("site_settings").upsert({ id: "editor_bio", value: editorBio }),
        supabase.from("site_settings").upsert({ id: "editor_mission", value: editorMission }),
        supabase.from("site_settings").upsert({ id: "editor_contact", value: editorContact }),
      ])
      setAboutMessage("Saved! The about page will update automatically.")
    } catch (err: unknown) {
      setAboutMessage("Error: " + (err as Error).message)
    } finally {
      setSavingAbout(false)
    }
  }

  if (!ready || loading) return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
      <span className="text-xs font-sans text-gray-400">Loading...</span>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <AdminHeader active="settings" topLeftLabel="Admin · Settings" onLogout={logout} />

      <div className="flex gap-0 border-b border-gray-200 mb-8">
        {(["photo", "about"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs font-sans font-bold tracking-widest uppercase px-4 py-2 border-b-2 transition-colors ${
              tab === t ? "border-[#1a6b3c] text-[#1a6b3c]" : "border-transparent text-gray-500 hover:text-[#1a1a1a]"
            }`}>
            {t === "photo" ? "Editor Photo" : "About Page"}
          </button>
        ))}
      </div>

      {tab === "photo" && (
        <div className="flex flex-col gap-6">
          <p className="text-sm font-sans text-gray-500 leading-relaxed">
            Upload your photo for the About page. Square image recommended, at least 400×400px.
          </p>

          {currentPhoto && (
            <div>
              <p className="text-xs font-sans font-bold tracking-widest uppercase text-gray-400 mb-2">Current photo</p>
              <img src={currentPhoto} alt="Editor"
                className="w-32 h-32 object-cover border border-gray-200"
                onError={() => setCurrentPhoto("")} />
            </div>
          )}

          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">
              Select new photo
            </label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange}
              className="w-full text-sm font-sans border border-gray-300 px-3 py-2 cursor-pointer" />
          </div>

          {imagePreview && (
            <div>
              <p className="text-xs font-sans font-bold tracking-widest uppercase text-gray-400 mb-2">Preview</p>
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover border border-gray-200" />
            </div>
          )}

          {photoMessage && (
            <div className={`px-4 py-3 text-sm font-sans border ${
              photoMessage.startsWith("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
            }`}>
              {photoMessage}
            </div>
          )}

          <button onClick={handlePhotoUpload} disabled={uploading || !imageFile}
            className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50 w-fit">
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
        </div>
      )}

      {tab === "about" && (
        <div className="flex flex-col gap-5">
          <p className="text-sm font-sans text-gray-500 leading-relaxed">
            Edit your About page content. Changes save directly to the database and update the live About page immediately.
          </p>

          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">
              Your name
            </label>
            <input type="text" value={editorName} onChange={e => setEditorName(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
          </div>

          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">
              Bio — who you are
            </label>
            <textarea value={editorBio} onChange={e => setEditorBio(e.target.value)} rows={5}
              placeholder="Your GIS background, where you are based, what you do..."
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed" />
          </div>

          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">
              Mission — why GeoBriefing exists
            </label>
            <textarea value={editorMission} onChange={e => setEditorMission(e.target.value)} rows={4}
              placeholder="Why did you start this? What gap does it fill?"
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed" />
          </div>

          <div>
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">
              Contact email
            </label>
            <input type="email" value={editorContact} onChange={e => setEditorContact(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
          </div>

          {aboutMessage && (
            <div className={`px-4 py-3 text-sm font-sans border ${
              aboutMessage.startsWith("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
            }`}>
              {aboutMessage}
            </div>
          )}

          <div className="flex gap-3 items-center">
            <button onClick={handleSaveAbout} disabled={savingAbout}
              className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-6 py-3 hover:bg-[#1a6b3c] transition-colors disabled:opacity-50">
              {savingAbout ? "Saving..." : "Save changes"}
            </button>
            <Link href="/about" target="_blank"
              className="text-xs font-sans text-[#1a6b3c] hover:underline">
              Preview About page →
            </Link>
          </div>

          {(editorBio || editorMission) && (
            <div className="border border-gray-200 p-5 bg-gray-50 mt-2">
              <p className="text-xs font-sans font-bold text-gray-400 uppercase tracking-widest mb-3">Live preview</p>
              {editorName && <h3 className="text-lg font-bold mb-3">{editorName}</h3>}
              {editorBio && <p className="text-sm font-sans text-gray-700 leading-relaxed mb-3">{editorBio}</p>}
              {editorMission && <p className="text-sm font-sans text-gray-700 leading-relaxed mb-3">{editorMission}</p>}
              {editorContact && (
                <p className="text-sm font-sans text-gray-500">
                  Contact: <span className="text-[#1a6b3c]">{editorContact}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SettingsAdminPage