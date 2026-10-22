import { REGION_HUES, TYPE_HUES } from "@/lib/regions"

type PillStyle = React.CSSProperties & { "--h"?: number; "--c"?: number }

const hueStyle = (hue: number | null | undefined): PillStyle =>
  hue == null ? { "--h": 0, "--c": 0 } : { "--h": hue }

/** Filled pill. Every region shares lightness and chroma; only the hue changes. */
export const RegionPill = ({ region, className = "" }: { region: string | null | undefined; className?: string }) => {
  if (!region) return null
  return (
    <span className={`pill pill-region ${className}`} style={hueStyle(REGION_HUES[region])}>
      {region}
    </span>
  )
}

/** Outlined pill for story, map, event and licence types. Unknown values render neutral. */
export const TypePill = ({
  kind, value, className = "",
}: {
  kind: keyof typeof TYPE_HUES
  value: string | null | undefined
  className?: string
}) => {
  if (!value) return null
  const hue = TYPE_HUES[kind]?.[value.toLowerCase()]
  return (
    <span
      className={`pill pill-type ${className}`}
      style={hue == null ? undefined : hueStyle(hue)}
      data-neutral={hue == null ? "" : undefined}
    >
      {value}
    </span>
  )
}
