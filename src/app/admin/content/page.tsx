"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/AdminHeader"
import { supabaseAdmin as supabase } from "@/lib/supabase"

interface Issue { id: string; issue_number: number; headline: string; editor_note: string | null; status: string }
interface Joke { id: string; setup: string; punchline: string; topic: string }
interface Fact { id: string; fact: string; source: string; topic: string }
interface Story { id: string; title: string; content: string; story_type: string; status: string }

const ContentAdminPage = () => {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [jokes, setJokes] = useState<Joke[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [message, setMessage] = useState("")
  const [tab, setTab] = useState<"editorial" | "jokes" | "facts" | "stories">("editorial")

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("gb_admin")) {
      router.push("/admin")
      return
    }
    // eslint-disable-next-line react-hooks/immutability
    loadData()
  }, [])

  const loadData = async () => {
    const [{ data: i }, { data: j }, { data: f }, { data: s }] = await Promise.all([
      supabase.from("issues").select("id, issue_number, headline, editor_note, status").order("issue_number", { ascending: false }).limit(5),
      supabase.from("jokes").select("*").order("created_at", { ascending: false }).limit(15),
      supabase.from("fun_facts").select("*").order("created_at", { ascending: false }).limit(15),
      supabase.from("gis_stories").select("*").order("created_at", { ascending: false }).limit(15),
    ])
    setIssues(i || [])
    setJokes(j || [])
    setFacts(f || [])
    setStories(s || [])
    if (i && i.length > 0) setEditingIssue(i[0])
  }

  const handleLogout = () => {
    localStorage.removeItem("gb_admin")
    router.push("/admin")
  }

  const saveEditorial = async () => {
    if (!editingIssue) return
    const { error } = await supabase.from("issues").update({ headline: editingIssue.headline, editor_note: editingIssue.editor_note }).eq("id", editingIssue.id)
    setMessage(error ? "Error: " + error.message : "Editorial saved!")
  }

  const approveStory = async (id: string) => {
    await supabase.from("gis_stories").update({ status: "published" }).eq("id", id)
    setMessage("Story published!")
    loadData()
  }

  const deleteItem = async (table: string, id: string) => {
    await supabase.from(table).delete().eq("id", id)
    setMessage("Deleted.")
    loadData()
  }

  const updateJoke = async (joke: Joke) => {
    await supabase.from("jokes").update({ setup: joke.setup, punchline: joke.punchline }).eq("id", joke.id)
    setMessage("Joke updated!")
  }

  const updateFact = async (fact: Fact) => {
    await supabase.from("fun_facts").update({ fact: fact.fact, source: fact.source }).eq("id", fact.id)
    setMessage("Fact updated!")
  }

  const updateStory = async (story: Story) => {
    await supabase.from("gis_stories").update({ title: story.title, content: story.content }).eq("id", story.id)
    setMessage("Story updated!")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 font-serif">

      <AdminHeader active="content" topLeftLabel="Admin · Content Review" onLogout={handleLogout} />

      {message && (
        <div className={`mb-4 px-4 py-3 text-sm font-sans border ${
          message.startsWith("Error") ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-0 border-b border-gray-200 mb-8 overflow-x-auto whitespace-nowrap">
        {(["editorial", "jokes", "facts", "stories"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 text-xs font-sans font-bold tracking-widest uppercase px-3 sm:px-4 py-2 border-b-2 transition-colors capitalize ${
              tab === t ? "border-[#1a6b3c] text-[#1a6b3c]" : "border-transparent text-gray-500 hover:text-[#1a1a1a]"
            }`}>
            {t} {t === "editorial" ? `(${issues.length})` : t === "jokes" ? `(${jokes.length})` : t === "facts" ? `(${facts.length})` : `(${stories.length})`}
          </button>
        ))}
      </div>

      {tab === "editorial" && (
        <div>
          <div className="mb-4">
            <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Select Issue</label>
            <select value={editingIssue?.id || ""} onChange={e => { const found = issues.find(i => i.id === e.target.value); if (found) setEditingIssue({ ...found }) }}
              className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] bg-white">
              {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number} — {i.headline.slice(0, 50)}</option>)}
            </select>
          </div>
          {editingIssue && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Headline</label>
                <input type="text" value={editingIssue.headline} onChange={e => setEditingIssue({ ...editingIssue, headline: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" />
              </div>
              <div>
                <label className="text-xs font-sans font-bold tracking-widest uppercase text-gray-500 block mb-2">Editor Note</label>
                <textarea value={editingIssue.editor_note || ""} onChange={e => setEditingIssue({ ...editingIssue, editor_note: e.target.value })}
                  rows={5} className="w-full border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none leading-relaxed" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
                <span className={`text-xs font-sans px-2 py-1 rounded w-fit ${editingIssue.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {editingIssue.status}
                </span>
                <button onClick={saveEditorial}
                  className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-6 py-2 hover:bg-[#1a6b3c] transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "jokes" && (
        <div>
          {jokes.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No jokes yet. Run the content generator first.</p>}
          {jokes.map(joke => (
            <div key={joke.id} className="border-b border-gray-100 py-4">
              <div className="flex flex-col gap-2 mb-3">
                <input type="text" value={joke.setup}
                  onChange={e => setJokes(jokes.map(j => j.id === joke.id ? { ...j, setup: e.target.value } : j))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Setup..." />
                <input type="text" value={joke.punchline}
                  onChange={e => setJokes(jokes.map(j => j.id === joke.id ? { ...j, punchline: e.target.value } : j))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a]" placeholder="Punchline..." />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-sans text-gray-400">{joke.topic}</span>
                <button onClick={() => updateJoke(joke)} className="text-xs font-sans text-[#1a6b3c] font-bold hover:underline">Save</button>
                <button onClick={() => deleteItem("jokes", joke.id)} className="text-xs font-sans text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "facts" && (
        <div>
          {facts.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No fun facts yet. Run the content generator first.</p>}
          {facts.map(fact => (
            <div key={fact.id} className="border-b border-gray-100 py-4">
              <textarea value={fact.fact} onChange={e => setFacts(facts.map(f => f.id === fact.id ? { ...f, fact: e.target.value } : f))}
                rows={3} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-2" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <input type="text" value={fact.source} onChange={e => setFacts(facts.map(f => f.id === fact.id ? { ...f, source: e.target.value } : f))}
                  className="flex-1 border border-gray-200 px-2 py-1 text-xs font-sans outline-none" placeholder="Source..." />
                <div className="flex items-center gap-4">
                  <button onClick={() => updateFact(fact)} className="text-xs font-sans text-[#1a6b3c] font-bold hover:underline">Save</button>
                  <button onClick={() => deleteItem("fun_facts", fact.id)} className="text-xs font-sans text-red-400 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "stories" && (
        <div>
          {stories.length === 0 && <p className="text-sm font-sans text-gray-400 italic">No stories yet. Run the content generator first.</p>}
          {stories.map(story => (
            <div key={story.id} className="border border-gray-200 p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                <input type="text" value={story.title}
                  onChange={e => setStories(stories.map(s => s.id === story.id ? { ...s, title: e.target.value } : s))}
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm font-sans font-bold outline-none focus:border-[#1a1a1a] sm:mr-3" />
                <span className={`text-xs font-sans px-2 py-1 rounded whitespace-nowrap w-fit ${story.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {story.status}
                </span>
              </div>
              <textarea value={story.content} onChange={e => setStories(stories.map(s => s.id === story.id ? { ...s, content: e.target.value } : s))}
                rows={6} className="w-full border border-gray-200 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a1a1a] resize-none mb-3 leading-relaxed" />
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-sans text-gray-400">{story.story_type}</span>
                <button onClick={() => updateStory(story)} className="text-xs font-sans text-[#1a6b3c] font-bold hover:underline">Save edits</button>
                {story.status === "draft" && (
                  <button onClick={() => approveStory(story.id)} className="text-xs font-sans text-[#1a6b3c] font-bold hover:underline">Publish</button>
                )}
                <button onClick={() => deleteItem("gis_stories", story.id)} className="text-xs font-sans text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ContentAdminPage