"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import AdminHeader from "@/components/AdminHeader"
import { AdminLoading, AdminTitle, BigBtn, Btn, Notice, inputCls } from "@/components/AdminUI"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[190px_minmax(0,1fr)] gap-x-4 gap-y-2 items-start py-3.5 border-b border-hair">
    <div className="sm:pt-2.5">
      <div className="font-sans font-semibold text-sm">{label}</div>
      {hint && <div className="font-sans text-xs text-meta mt-0.5">{hint}</div>}
    </div>
    <div>{children}</div>
  </div>
)

const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="font-sans font-bold text-label tracking-label uppercase text-accent pt-7 pb-1">{children}</div>
)

const SettingsAdminPage = () => {
  const { ready, logout } = useAdminAuth()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [currentPhoto, setCurrentPhoto] = useState("")
  const [uploading, setUploading] = useState(false)
  const [editorName, setEditorName] = useState("")
  const [editorBio, setEditorBio] = useState("")
  const [editorMission, setEditorMission] = useState("")
  const [editorContact, setEditorContact] = useState("")
  const [publishDay, setPublishDay] = useState("Sunday")
  const [publishTime, setPublishTime] = useState("15:00")
  const [timezone, setTimezone] = useState("Asia/Karachi")
  const [fromAddress, setFromAddress] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
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
      const day = (s["publish_day"] || "sunday").toLowerCase()
      setPublishDay(day.charAt(0).toUpperCase() + day.slice(1))
      setPublishTime(s["publish_time"] || "15:00")
      setTimezone(s["timezone"] || "Asia/Karachi")
      setFromAddress(s["from_address"] || "GeoBriefing <onboarding@resend.dev>")
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
    if (!imageFile) { setMessage("Please select a photo first."); return }
    setUploading(true)
    setMessage("")
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
      setMessage("Photo uploaded and saved.")
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: timezone })
    } catch {
      setMessage(`Error: "${timezone}" is not a valid timezone.`)
      return
    }
    setSaving(true)
    setMessage("")
    try {
      const results = await Promise.all([
        supabase.from("site_settings").upsert({ id: "editor_name", value: editorName }),
        supabase.from("site_settings").upsert({ id: "editor_bio", value: editorBio }),
        supabase.from("site_settings").upsert({ id: "editor_mission", value: editorMission }),
        supabase.from("site_settings").upsert({ id: "editor_contact", value: editorContact }),
        supabase.from("site_settings").upsert({ id: "publish_day", value: publishDay.toLowerCase() }),
        supabase.from("site_settings").upsert({ id: "publish_time", value: publishTime }),
        supabase.from("site_settings").upsert({ id: "timezone", value: timezone }),
        supabase.from("site_settings").upsert({ id: "from_address", value: fromAddress }),
      ])
      const failed = results.find(r => r.error)
      if (failed?.error) throw failed.error
      setMessage("Settings saved. The site updates on the next page load.")
    } catch (err: unknown) {
      setMessage("Error: " + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!ready || loading) return <AdminLoading />

  return (
    <div className="min-h-screen">
      <AdminHeader active="settings" onLogout={logout} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">
        <div className="max-w-[720px]">
          <AdminTitle title="Settings" action={
            <Link href="/about" target="_blank" className="font-sans font-semibold text-xs tracking-nav uppercase text-accent hover:text-accent-deep">
              Preview About page ↗
            </Link>
          } />
          <Notice message={message} />

          <GroupLabel>Publishing</GroupLabel>
          <Row label="Publish day" hint={`Used in every "Every ${publishDay}" line`}>
            <select value={publishDay} onChange={e => setPublishDay(e.target.value)} className={inputCls}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Row>
          <Row label="Publish time" hint={`In ${timezone}`}>
            <input type="time" value={publishTime} onChange={e => setPublishTime(e.target.value)} className={inputCls} />
          </Row>
          <Row label="Timezone" hint="IANA name, e.g. Asia/Karachi">
            <input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls} />
          </Row>
          <Row label="From address" hint="Sender for the newsletter. Needs a domain verified in Resend.">
            <input type="text" value={fromAddress} onChange={e => setFromAddress(e.target.value)} className={inputCls} />
          </Row>

          <GroupLabel>The editor</GroupLabel>
          <Row label="Editor name" hint="Shown on every note and email">
            <input type="text" value={editorName} onChange={e => setEditorName(e.target.value)} className={inputCls} />
          </Row>
          <Row label="Editor photo" hint="Square, 400px minimum">
            <div className="flex items-center gap-4">
              {imagePreview || currentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={imagePreview || currentPhoto} alt="Editor" onError={() => setCurrentPhoto("")}
                  className="w-16 h-16 rounded-full object-cover border border-hair-2 flex-none" />
              ) : <span className="w-16 h-16 rounded-full hatch border border-hair-2 flex-none" />}
              <div className="flex flex-wrap gap-2">
                <label className="font-sans font-semibold text-label leading-none tracking-nav uppercase px-3.5 py-2.5 border border-ink bg-card text-ink hover:border-accent hover:text-accent cursor-pointer">
                  {imageFile ? "Change" : "Choose photo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} className="sr-only" />
                </label>
                {imageFile && (
                  <Btn variant="primary" onClick={handlePhotoUpload} disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</Btn>
                )}
              </div>
            </div>
          </Row>
          <Row label="Bio" hint="About page, two or three sentences">
            <textarea value={editorBio} onChange={e => setEditorBio(e.target.value)} rows={4}
              placeholder="Your GIS background, where you are based, what you do…" className={`${inputCls} resize-y`} />
          </Row>
          <Row label="Mission" hint="Why GeoBriefing exists">
            <textarea value={editorMission} onChange={e => setEditorMission(e.target.value)} rows={3}
              placeholder="Why did you start this? What gap does it fill?" className={`${inputCls} resize-y`} />
          </Row>
          <Row label="Contact email" hint="Reply-To for every email, and where test emails go">
            <input type="email" value={editorContact} onChange={e => setEditorContact(e.target.value)} className={inputCls} />
          </Row>

          <BigBtn onClick={handleSave} disabled={saving} className="mt-6">
            {saving ? "Saving…" : "Save settings"}
          </BigBtn>
        </div>
      </div>
    </div>
  )
}

export default SettingsAdminPage
