import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Logo from "@/components/Logo"

interface Job {
  id: string
  title: string
  company: string
  location: string
  job_type: string
  description: string
  apply_url: string
  source: string
  posted_at: string
  is_featured: boolean
  bucket: string
}

const JobCard = ({ job }: { job: Job }) => (
  <div className={`border-b border-gray-200 py-5 ${job.is_featured ? "border border-[#1a6b3c] bg-emerald-50 px-4 rounded mb-2" : ""}`}>
    {job.is_featured && (
      <span className="text-xs font-sans font-bold text-[#1a6b3c] tracking-widest uppercase mb-2 block">Featured</span>
    )}
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="text-base font-bold leading-snug mb-1">{job.title}</h3>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-sm font-sans text-gray-600">{job.company}</span>
          {job.location && <span className="text-xs font-sans text-gray-400">{job.location}</span>}
          {job.job_type && (
            <span className="text-xs font-sans px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{job.job_type}</span>
          )}
        </div>
        {job.description && (
          <p className="text-sm font-sans text-gray-500 leading-relaxed line-clamp-2 mb-2">{job.description}</p>
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs font-sans text-gray-400">{job.source}</span>
          {job.posted_at && (
            <span className="text-xs font-sans text-gray-400">
              {new Date(job.posted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
        className="flex-shrink-0 bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-4 py-2 hover:bg-[#1a6b3c] transition-colors">
        Apply
      </a>
    </div>
  </div>
)

const JobsPage = async () => {
  const { data: pkJobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("bucket", "pakistan")
    .eq("is_active", true)
    .order("posted_at", { ascending: false })

  const { data: intlJobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("bucket", "international")
    .eq("is_active", true)
    .order("posted_at", { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 font-serif">

      <div className="border-t-4 border-b border-[#1a1a1a] mb-1 pt-4 pb-3">
        <div className="flex items-center justify-center gap-6 py-3 border-t border-b border-[#1a1a1a]">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <Logo size="lg" />
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>
      </div>

      <nav className="flex gap-6 py-2 border-b border-gray-300 mb-8 font-sans text-xs tracking-widest uppercase">
        <Link href="/" className="text-gray-500 hover:text-[#1a1a1a]">This week</Link>
        <Link href="/issues" className="text-gray-500 hover:text-[#1a1a1a]">All issues</Link>
        <Link href="/jobs" className="text-[#1a6b3c] font-bold">Jobs</Link>
        <Link href="/subscribe" className="text-gray-500 hover:text-[#1a1a1a]">Subscribe</Link>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GIS Jobs</h1>
        <p className="text-sm font-sans text-gray-500 leading-relaxed">
          Curated GIS, geospatial, and remote sensing opportunities updated weekly.
          Pakistan listings and international roles open to global applicants.
        </p>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a1a1a]">Pakistan</h2>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-xs font-sans text-gray-400">{pkJobs?.length || 0} listings</span>
        </div>
        {!pkJobs || pkJobs.length === 0 ? (
          <div className="border border-gray-200 p-6 text-center">
            <p className="text-sm font-sans text-gray-500 mb-1">No Pakistan GIS listings this week.</p>
            <p className="text-xs font-sans text-gray-400">Check back Monday - we update weekly.</p>
          </div>
        ) : (
          <div>{pkJobs.map((job: Job) => <JobCard key={job.id} job={job} />)}</div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xs font-sans font-bold tracking-widest uppercase text-[#1a1a1a]">International</h2>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-xs font-sans text-gray-400">{intlJobs?.length || 0} listings</span>
        </div>
        <p className="text-xs font-sans text-gray-400 mb-4 italic">
          Roles open to international applicants or based outside Pakistan.
        </p>
        {!intlJobs || intlJobs.length === 0 ? (
          <div className="border border-gray-200 p-6 text-center">
            <p className="text-sm font-sans text-gray-500">No international listings this week.</p>
          </div>
        ) : (
          <div>{intlJobs.map((job: Job) => <JobCard key={job.id} job={job} />)}</div>
        )}
      </section>

      <div className="border border-[#1a6b3c] p-6 mb-8">
        <h3 className="text-lg font-bold mb-1">Get jobs in your inbox.</h3>
        <p className="text-sm font-sans text-gray-600 mb-4">
          Subscribe to GeoBriefing - job listings every Monday alongside GIS news.
        </p>
        <div className="flex gap-2">
          <input type="email" placeholder="your@email.com"
            className="flex-1 border border-gray-300 px-3 py-2 text-sm font-sans outline-none focus:border-[#1a6b3c]" />
          <button className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-4 py-2 hover:bg-[#1a6b3c] transition-colors">
            Subscribe
          </button>
        </div>
      </div>

      <footer className="border-t-2 border-[#1a1a1a] pt-4 flex justify-between items-center">
        <span className="text-xs font-sans text-gray-400">2026 GeoBriefing</span>
        <Link href="/" className="text-xs font-sans text-[#1a6b3c] hover:underline">Back to latest issue</Link>
      </footer>

    </div>
  )
}

export default JobsPage
