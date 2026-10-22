export const revalidate = 0

import { supabase } from "@/lib/supabase"
import { getSettings } from "@/lib/settings"
import Masthead from "@/components/Masthead"
import Footer from "@/components/Footer"
import { RegionPill } from "@/components/Pills"
import { Label } from "@/components/Editorial"

interface Source {
  id: string
  name: string
  url: string
  group: string | null
  group_name?: string | null
  description: string | null
  region: string | null
  language: string | null
  sort_order: number | null
}

const SourcesPage = async () => {
  const [{ data, error }, settings] = await Promise.all([
    supabase.from("sources").select("*").eq("active", true).order("sort_order", { ascending: true }),
    getSettings(),
  ])

  const sources = (error ? [] : data || []) as Source[]

  // Keep groups in the order their first source appears.
  const groups: { name: string; items: Source[] }[] = []
  sources.forEach(s => {
    const name = s.group ?? s.group_name ?? "Other"
    const g = groups.find(x => x.name === name)
    if (g) g.items.push(s)
    else groups.push({ name, items: [s] })
  })

  const suggestHref = settings.editorContact ? `mailto:${settings.editorContact}?subject=Source%20suggestion` : "/subscribe"

  return (
    <div className="min-h-screen">
      <Masthead active="sources" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 md:gap-9 md:items-end pt-7 sm:pt-10 pb-6 sm:pb-7 border-b-2 border-ink">
          <div>
            <Label>Sources</Label>
            <h1 className="mt-2.5 font-display font-bold text-[30px] sm:text-[44px] leading-[1.08] tracking-[-0.012em] text-balance">
              Where the news comes from
            </h1>
          </div>
          <p className="font-serif text-[17px] leading-[1.6] text-ink-2">
            These are the places we read every week. Every item in an issue links back to its original source.
          </p>
        </div>

        {groups.length === 0 && (
          <p className="py-12 font-serif text-lg leading-[1.6] text-ink-2 max-w-[640px]">
            The source list is being put together. In the meantime, every story in every issue links to where it came from.
          </p>
        )}

        {groups.map(group => (
          <div key={group.name} className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-x-6 pt-7">
            <div className="sm:pt-4">
              <Label className="leading-[1.3]">{group.name}</Label>
            </div>
            <div>
              {group.items.map(s => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_120px_56px] gap-x-4 gap-y-2 items-baseline py-3.5 border-b border-hair text-ink hover:text-accent">
                  <span>
                    <span className="font-display font-semibold text-lg sm:text-h3 leading-[1.3]">{s.name}</span>
                    {s.description && <span className="block font-sans text-[15px] leading-[1.5] text-ink-3 mt-0.5">{s.description}</span>}
                    {s.region && <span className="sm:hidden block mt-2"><RegionPill region={s.region} /></span>}
                  </span>
                  <span className="hidden sm:block justify-self-start"><RegionPill region={s.region} /></span>
                  <span className="font-mono text-xs text-meta text-right">{s.language}</span>
                </a>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-10 border-2 border-ink p-5 sm:px-6 sm:py-[22px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
          <div>
            <div className="font-display font-bold text-[22px] leading-[1.25]">Know a source we should be reading?</div>
            <div className="font-sans text-[15.5px] leading-[1.55] text-ink-3 mt-1">
              Reply to any issue with a link. Local-language outlets are especially welcome.
            </div>
          </div>
          <a href={suggestHref}
            className="flex-none self-start sm:self-auto min-h-11 text-center font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper px-5 py-4 hover:bg-accent">
            Suggest a source
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default SourcesPage
