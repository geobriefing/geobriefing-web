/**
 * "Ge" + ring + "Briefing" in Source Serif 4 Bold. The ring is sized to the font's "o",
 * so it scales with the font-size set by `size` (px).
 */
const Wordmark = ({ size, className = "" }: { size: number; className?: string }) => (
  <span
    className={`inline-flex items-baseline font-display font-bold leading-none tracking-[-0.015em] whitespace-nowrap ${className}`}
    style={{ fontSize: size }}
    aria-label="GeoBriefing"
    role="img"
  >
    <span aria-hidden="true">Ge</span>
    <svg
      viewBox="0 0 47 50"
      aria-hidden="true"
      className="flex-none relative"
      style={{ width: ".47em", height: ".5em", margin: "0 .03em", top: ".016em" }}
    >
      <path d="M23.5 0a23.5 25 0 1 0 .01 0zM23.5 7a15 18 0 1 1-.01 0z" fill="currentColor" fillRule="evenodd" />
      <circle cx="23.5" cy="25" r="8.5" fill="var(--color-dot)" />
    </svg>
    <span aria-hidden="true">Briefing</span>
  </span>
)

export default Wordmark
