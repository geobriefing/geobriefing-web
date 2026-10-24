"use client"
import { useState, useEffect } from "react"
import AdminHeader from "@/components/AdminHeader"
import { TypePill } from "@/components/Pills"
import { AdminLoading, AdminTitle, Btn, Field, Notice, StatusText, inputCls, softInputCls } from "@/components/AdminUI"
import { supabase } from "@/lib/supabase"
import { useAdminAuth } from "@/lib/useAdminAuth"
import SourcesEditor from "@/components/SourcesEditor"

interface Issue { id: string; issue_number: number; headline: string; editor_note: string | null; status: string }
interface Joke { id: string; setup: string; punchline: string; topic: string }
interface Fact { id: string; fact: string; source: string; topic: string }
interface Story { id: string; title: string; content: string; story_type: string; status: string }

type Tab = "editorial" | "jokes" | "facts" | "stories" | "sources"

const ContentAdminPage = () => {
  const { ready, logout } = useAdminAuth()
  const [issues, setIssues] = useState<Issue[]>([])
  const [jokes, setJokes] = useState<Joke[]>([])
  const [facts, setFacts] = useState<Fact[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [message, setMessage] = useState("")
  const [tab, setTab] = useState<Tab>("editorial")

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
    if (i && i.length > 0) setEditingIssue(prev => prev ?? i[0])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) loadData()
  }, [ready])

  const saveEditorial = async () => {
    if (!editingIssue) return
    const { error } = await supabase.from("issues").update({ headline: editingIssue.headline, editor_note: editingIssue.editor_note }).eq("id", editingIssue.id)
    setMessage(error ? "Error: " + error.message : "Editorial saved.")
  }

  const approveStory = async (id: string) => {
    await supabase.from("gis_stories").update({ status: "approved" }).eq("id", id)
    setMessage("Story approved.")
    loadData()
  }

  const deleteItem = async (table: string, id: string) => {
    await supabase.from(table).delete().eq("id", id)
    setMessage("Deleted.")
    loadData()
  }

  const updateJoke = async (joke: Joke) => {
    await supabase.from("jokes").update({ setup: joke.setup, punchline: joke.punchline }).eq("id", joke.id)
    setMessage("Joke updated.")
  }

  const updateFact = async (fact: Fact) => {
    await supabase.from("fun_facts").update({ fact: fact.fact, source: fact.source }).eq("id", fact.id)
    setMessage("Fact updated.")
  }

  const updateStory = async (story: Story) => {
    await supabase.from("gis_stories").update({ title: story.title, content: story.content }).eq("id", story.id)
    setMessage("Story updated.")
  }

  if (!ready) return <AdminLoading />

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "editorial", label: "Editorial", count: issues.length },
    { key: "jokes", label: "Jokes", count: jokes.length },
    { key: "facts", label: "Facts", count: facts.length },
    { key: "stories", label: "Stories", count: stories.length },
    { key: "sources", label: "Sources", count: -1 },
  ]

  return (
    <div className="min-h-screen">
      <AdminHeader active="content" onLogout={logout} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-12">
        <div className="max-w-[820px]">
          <AdminTitle title="Content" action={
            <div className="flex flex-wrap gap-1.5">
              {tabs.map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className={`min-h-11 sm:min-h-0 font-sans font-semibold text-label px-2.5 py-1.5 border cursor-pointer ${
                    tab === t.key ? "bg-ink text-paper border-ink" : "border-hair-2 text-ink hover:border-ink"
                  }`}>
                  {t.label}{t.count >= 0 ? ` ${t.count}` : ""}
                </button>
              ))}
            </div>
          } />
          <Notice message={message} />

          {tab === "sources" && <SourcesEditor />}

          {tab === "editorial" && (
            <div className="flex flex-col gap-4 mt-5">
              <Field label="Issue">
                <select value={editingIssue?.id || ""} onChange={e => { const found = issues.find(i => i.id === e.target.value); if (found) setEditingIssue({ ...found }) }} className={inputCls}>
                  {issues.map(i => <option key={i.id} value={i.id}>Issue #{i.issue_number} · {i.headline.slice(0, 50)}</option>)}
                </select>
              </Field>
              {editingIssue && (
                <>
                  <Field label="Headline">
                    <input type="text" value={editingIssue.headline} onChange={e => setEditingIssue({ ...editingIssue, headline: e.target.value })}
                      className={`${inputCls} font-display font-semibold text-h3`} />
                  </Field>
                  <Field label="From the editor" hint="First person. It runs under the headline with your name and photo.">
                    <textarea value={editingIssue.editor_note || ""} onChange={e => setEditingIssue({ ...editingIssue, editor_note: e.target.value })}
                      rows={6} className={`${inputCls} font-serif text-[17px] leading-[1.6] resize-y`} />
                  </Field>
                  <div className="flex justify-between items-center gap-3">
                    <StatusText status={editingIssue.status} />
                    <Btn variant="primary" onClick={saveEditorial}>Save changes</Btn>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "jokes" && (
            <div className="mt-2">
              {jokes.length === 0 && <p className="py-8 font-sans text-[15px] text-ink-3">No jokes yet. Run the content generator first.</p>}
              {jokes.map(joke => (
                <div key={joke.id} className="py-4 border-b border-hair flex flex-col gap-2">
                  <input type="text" value={joke.setup} aria-label="Setup"
                    onChange={e => setJokes(jokes.map(j => j.id === joke.id ? { ...j, setup: e.target.value } : j))}
                    className={`${softInputCls} font-serif text-base`} placeholder="Setup…" />
                  <input type="text" value={joke.punchline} aria-label="Punchline"
                    onChange={e => setJokes(jokes.map(j => j.id === joke.id ? { ...j, punchline: e.target.value } : j))}
                    className={`${softInputCls} font-serif italic text-base`} placeholder="Punchline…" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-xs text-meta flex-1">{joke.topic}</span>
                    <Btn onClick={() => updateJoke(joke)}>Save</Btn>
                    <Btn variant="danger" onClick={() => deleteItem("jokes", joke.id)}>Delete</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "facts" && (
            <div className="mt-2">
              {facts.length === 0 && <p className="py-8 font-sans text-[15px] text-ink-3">No fun facts yet. Run the content generator first.</p>}
              {facts.map(fact => (
                <div key={fact.id} className="py-4 border-b border-hair flex flex-col gap-2">
                  <textarea value={fact.fact} aria-label="Fact" onChange={e => setFacts(facts.map(f => f.id === fact.id ? { ...f, fact: e.target.value } : f))}
                    rows={3} className={`${softInputCls} font-sans text-base sm:text-[15px] leading-[1.55] resize-y`} />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input type="text" value={fact.source} aria-label="Source" onChange={e => setFacts(facts.map(f => f.id === fact.id ? { ...f, source: e.target.value } : f))}
                      className={`${softInputCls} font-sans text-base sm:text-sm flex-1`} placeholder="Source…" />
                    <div className="flex gap-2">
                      <Btn onClick={() => updateFact(fact)}>Save</Btn>
                      <Btn variant="danger" onClick={() => deleteItem("fun_facts", fact.id)}>Delete</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "stories" && (
            <div className="mt-2">
              {stories.length === 0 && <p className="py-8 font-sans text-[15px] text-ink-3">No stories yet. Run the content generator first.</p>}
              {stories.map(story => (
                <div key={story.id} className="bg-card border border-hair px-4 py-4 mt-3.5 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <TypePill kind="story" value={story.story_type} />
                    <StatusText status={story.status} />
                  </div>
                  <input type="text" value={story.title} aria-label="Title"
                    onChange={e => setStories(stories.map(s => s.id === story.id ? { ...s, title: e.target.value } : s))}
                    className={`${softInputCls} font-display font-semibold text-h3`} />
                  <textarea value={story.content} aria-label="Story" onChange={e => setStories(stories.map(s => s.id === story.id ? { ...s, content: e.target.value } : s))}
                    rows={6} className={`${softInputCls} font-sans text-base sm:text-[15px] leading-[1.55] resize-y`} />
                  <div className="flex flex-wrap gap-2">
                    {story.status === "draft" && <Btn variant="approve" onClick={() => approveStory(story.id)}>Approve</Btn>}
                    <Btn onClick={() => updateStory(story)}>Save edits</Btn>
                    <span className="flex-1" />
                    <Btn variant="danger" onClick={() => deleteItem("gis_stories", story.id)}>Delete</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentAdminPage
