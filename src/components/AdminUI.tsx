/** Shared admin form controls and buttons, styled to the design system. */

export const inputCls =
  "w-full font-sans text-base sm:text-[15px] text-ink px-3 py-2.5 border border-hair-2 bg-card rounded-none outline-none focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent)]"

export const softInputCls =
  "w-full px-2.5 py-2 border border-hair bg-paper rounded-none outline-none text-ink focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent)]"

const btnBase = "min-h-11 sm:min-h-0 font-sans font-semibold text-label leading-none tracking-nav uppercase px-3.5 py-2.5 border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"

export const Btn = ({
  variant = "secondary", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "approve" | "primary" | "secondary" | "danger" | "quiet" }) => {
  const styles = {
    approve: "border-accent bg-accent text-paper hover:bg-accent-deep hover:border-accent-deep",
    primary: "border-ink bg-ink text-paper hover:bg-accent hover:border-accent",
    secondary: "border-ink bg-card text-ink hover:border-accent hover:text-accent",
    danger: "border-danger bg-card text-danger hover:bg-danger-tint",
    quiet: "border-[#B9B8B0] bg-transparent text-ink-3 hover:text-ink",
  }[variant]
  return <button type="button" className={`${btnBase} ${styles} ${className}`} {...props} />
}

/** Big primary action, e.g. "Save settings" or "Mark section reviewed". */
export const BigBtn = ({ className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={`w-full sm:w-auto min-h-11 font-sans font-semibold text-xs leading-none tracking-button uppercase px-5 py-3.5 bg-ink text-paper hover:bg-accent transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    {...props}
  />
)

export const Field = ({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="font-sans font-semibold text-label tracking-nav uppercase text-ink">{label}</span>
    {children}
    {hint && <span className="font-sans text-xs text-meta">{hint}</span>}
  </label>
)

/** Page title row: 26px serif title, 2px ink rule, optional action on the right. */
export const AdminTitle = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="flex flex-wrap justify-between items-center gap-3 pt-6 pb-3.5 border-b-2 border-ink">
    <h1 className="font-display font-bold text-[26px] leading-none">{title}</h1>
    {action}
  </div>
)

/** Inline success / error message. Errors start with "Error". */
export const Notice = ({ message }: { message: string }) => {
  if (!message) return null
  const error = message.startsWith("Error") || message.startsWith("Please")
  return (
    <div className={`my-4 px-4 py-3 font-sans text-sm border-l-[3px] ${
      error ? "border-danger bg-danger-tint text-danger" : "border-accent bg-accent-tint text-ink-2"
    }`} role="status">
      {message}
    </div>
  )
}

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Approved", cls: "text-accent" },
  published: { label: "Published", cls: "text-accent" },
  discarded: { label: "Discarded", cls: "text-danger" },
  draft: { label: "Pending", cls: "text-warn" },
  scheduled: { label: "Scheduled", cls: "text-warn" },
}

export const StatusText = ({ status }: { status: string }) => {
  const s = STATUS[status] || { label: status, cls: "text-meta" }
  return <span className={`font-sans font-bold text-[10.5px] leading-none tracking-meta uppercase ${s.cls}`}>{s.label}</span>
}

/** Small outlined chip used for section status in the desk sidebar. */
export const Chip = ({ tone, children }: { tone: "review" | "reviewed" | "skipped" | "empty"; children: React.ReactNode }) => {
  const cls = {
    review: "text-warn border-[#E2C98A] bg-warn-tint",
    reviewed: "text-accent border-[#A9D1B8] bg-accent-tint",
    skipped: "text-meta border-hair-2 bg-paper-2",
    empty: "text-danger border-[#E5B3A8] bg-danger-tint",
  }[tone]
  return <span className={`font-sans font-semibold text-[10px] leading-none tracking-[.1em] uppercase px-1.5 py-1 border whitespace-nowrap ${cls}`}>{children}</span>
}

export const AdminLoading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <span className="font-sans text-xs tracking-meta uppercase text-meta">Loading…</span>
  </div>
)
