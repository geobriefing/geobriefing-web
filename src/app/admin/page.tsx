"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const AdminPage = () => {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("gb_admin")) {
      router.push("/admin/comics")
    }
  }, [])

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      localStorage.setItem("gb_admin", "true")
      router.push("/admin/comics")
    } else {
      setError("Wrong password")
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center font-serif px-4">
      <div className="border border-[#1a1a1a] p-6 sm:p-8 w-full max-w-xs">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">GeoBriefing</h1>
          <p className="text-xs font-sans text-gray-400 mt-1 tracking-widest uppercase">Admin</p>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="w-full border border-gray-300 px-3 py-2 text-sm font-sans mb-3 outline-none focus:border-[#1a1a1a]"
        />
        {error && <p className="text-red-500 text-xs font-sans mb-3">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase py-2 hover:bg-[#1a6b3c] transition-colors"
        >
          Enter
        </button>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link href="/" className="text-xs font-sans text-gray-400 hover:text-[#1a6b3c]">
            Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminPage