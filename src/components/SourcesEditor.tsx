"use client"
import { useCallback, useEffect, useState } from "react"
import { Btn, Notice, softInputCls } from "@/components/AdminUI"
import { adminFetch, adminPost } from "@/lib/adminApi"
import { REGIONS } from "@/lib/deskSections"

interface Source {
  id: string
  name: string
  url: string
  group_name: string
  description: string | null
  region: string | null
  language: string | null
  sort_order: number
  active: boolean
}

const cls = `${softInputCls} font-sans text-base sm:text-[15px]`

/** Content tab: the list behind the public /sources page. */
const SourcesEditor = () => {
  const [rows, setRows] = useState<Source[]>([])
  const [dirty, setDirty] = useState<Record<string, Partial<Source>>>({})
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { rows } = await adminFetch<{ rows: Source[] }>("/api/admin/items?table=sources")
      setRows(rows)
      setDirty({})
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (payload: Record<string, unknown>, ok: string) => {
    setMessage("")
    try {
      await adminPost("/api/admin/items", { table: "sources", ...payload })
      setMessage(ok)
      await load()
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`)
    }
  }

  const set = (id: string, patch: Partial<Source>) => setDirty(d => ({ ...d, [id]: { ...d[id], ...patch } }))
  const v = <K extends keyof Source>(row: Source, k: K) => (dirty[row.id]?.[k] ?? row[k]) as Source[K]

  const groups = [...new Set(rows.map(r => r.group_name))]

  if (loading) return <p className="py-8 font-sans text-[15px] text-ink-3">Loading sources…</p>

  return (
    <div className="mt-2">
      <Notice message={message} />
      <div className="flex flex-wrap justify-between items-center gap-3 py-3">
        <p className="font-sans text-sm text-ink-3">{rows.length} sources. Inactive ones are hidden from the public page.</p>
        <Btn variant="primary" onClick={() => act({
          action: "create",
          patch: { name: "New source", url: "https://", group_name: groups[0] || "Open data", region: "Global", language: "EN", sort_order: rows.length * 10 + 10 },
        }, "Source added.")}>+ Add source</Btn>
      </div>
      {groups.map(group => (
        <div key={group} className="mt-4">
          <div className="font-sans font-bold text-label tracking-label uppercase text-accent pb-2 border-b border-ink">{group}</div>
          {rows.filter(r => r.group_name === group).map(row => (
            <div key={row.id} className={`py-3.5 border-b border-hair flex flex-col gap-2 ${v(row, "active") ? "" : "opacity-60"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2">
                <input aria-label="Name" value={v(row, "name")} onChange={e => set(row.id, { name: e.target.value })} className={`${cls} font-display font-semibold`} />
                <input aria-label="URL" value={v(row, "url")} onChange={e => set(row.id, { url: e.target.value })} className={cls} />
              </div>
              <input aria-label="Description" value={v(row, "description") || ""} onChange={e => set(row.id, { description: e.target.value })} className={cls} placeholder="What we read it for" />
              <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_90px_80px] gap-2">
                <input aria-label="Group" value={v(row, "group_name")} onChange={e => set(row.id, { group_name: e.target.value })} className={cls} placeholder="Group" />
                <select aria-label="Region" value={v(row, "region") || "Global"} onChange={e => set(row.id, { region: e.target.value })} className={cls}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input aria-label="Language" value={v(row, "language") || ""} onChange={e => set(row.id, { language: e.target.value })} className={cls} placeholder="EN" />
                <input aria-label="Order" type="number" value={v(row, "sort_order")} onChange={e => set(row.id, { sort_order: Number(e.target.value) })} className={cls} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 font-sans text-sm text-ink-2 min-h-11 sm:min-h-0 mr-2">
                  <input type="checkbox" checked={v(row, "active")} onChange={e => set(row.id, { active: e.target.checked })} />
                  Shown on /sources
                </label>
                {dirty[row.id] && <Btn onClick={() => act({ action: "save", id: row.id, patch: dirty[row.id] }, "Source saved.")}>Save</Btn>}
                <span className="flex-1" />
                <Btn variant="danger" onClick={() => { if (window.confirm(`Delete ${row.name}?`)) act({ action: "delete", id: row.id }, "Source deleted.") }}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SourcesEditor
