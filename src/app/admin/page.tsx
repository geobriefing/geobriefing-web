"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Wordmark from "@/components/Wordmark"
import { AdminLoading, Field, inputCls } from "@/components/AdminUI"

const AdminPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/admin/review")
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInError) {
      setError("Wrong email or password.")
      return
    }
    router.push("/admin/review")
  }

  if (checkingSession) return <AdminLoading />

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] bg-paper px-6 py-8 sm:px-12 sm:pt-10 sm:pb-11">
        <div className="h-1 bg-ink" />
        <div className="h-px bg-ink mt-[3px]" />
        <div className="flex justify-center pt-6 pb-1.5">
          <Wordmark size={34} />
        </div>
        <div className="text-center font-sans font-semibold text-[10.5px] tracking-label uppercase text-danger pb-6 border-b border-ink">
          Private · Editors only
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5 pt-6">
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"
              className={`${inputCls} border-ink text-base py-3`} />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
              className={`${inputCls} border-ink text-base py-3`} />
          </Field>
          <button type="submit" disabled={loading}
            className="mt-1.5 font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper p-4 hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Logging in…" : "Log in"}
          </button>
          {error && <span className="font-sans text-[13px] text-danger" role="alert">{error}</span>}
        </form>
        <div className="mt-6 pt-4 border-t border-hair">
          <Link href="/" className="font-sans text-xs tracking-meta uppercase text-meta hover:text-accent">← Back to site</Link>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
