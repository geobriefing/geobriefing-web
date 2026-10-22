"use client"
import { useEffect, useRef, useState } from "react"
import { SectionLabel } from "@/components/Editorial"

interface GeoGuesserData {
  lat: number
  lon: number
  name: string
  hint: string
  region: string
}

const pinHtml = (color: string, size: number) =>
  `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:3px solid #FAFAF7;box-shadow:0 0 0 1px #1A1A1A"></div>`

const GeoGuesser = ({ data }: { data: GeoGuesserData }) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const [guess, setGuess] = useState<{ lat: number; lon: number } | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [distance, setDistance] = useState<number | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  const revealedRef = useRef(false)

  useEffect(() => {
    if (mapLoaded || !mapRef.current) return

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L
      leafletRef.current = L

      const map = L.map(mapRef.current, { zoomControl: true, tap: true }).setView([30, 60], 3)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap"
      }).addTo(map)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        if (revealedRef.current) return
        const { lat, lng } = e.latlng
        setGuess({ lat, lon: lng })

        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({ html: pinHtml("#1A6B3C", 18), className: "", iconSize: [18, 18], iconAnchor: [9, 9] })
        }).addTo(map)
      })

      mapInstanceRef.current = map
      setMapLoaded(true)

      // Ensure tiles render correctly if the map was created while its
      // container was hidden or mid-resize (common on mobile layouts).
      setTimeout(() => map.invalidateSize(), 200)
    }
    document.body.appendChild(script)
  }, [mapLoaded])

  // Re-measure the map if the window resizes (orientation change, etc).
  useEffect(() => {
    if (!mapLoaded) return
    const handleResize = () => mapInstanceRef.current?.invalidateSize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mapLoaded])

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const handleReveal = () => {
    if (!guess || !leafletRef.current || !mapInstanceRef.current) return
    const L = leafletRef.current
    const map = mapInstanceRef.current
    const dist = haversineDistance(guess.lat, guess.lon, data.lat, data.lon)
    setDistance(Math.round(dist))
    setRevealed(true)
    revealedRef.current = true

    L.marker([data.lat, data.lon], {
      icon: L.divIcon({ html: pinHtml("#A8321E", 18), className: "", iconSize: [18, 18], iconAnchor: [9, 9] })
    }).addTo(map).bindPopup(data.name).openPopup()

    L.polyline([[guess.lat, guess.lon], [data.lat, data.lon]], {
      color: "#1A6B3C", dashArray: "5,8", weight: 2
    }).addTo(map)

    map.fitBounds([[guess.lat, guess.lon], [data.lat, data.lon]], { padding: [40, 40] })
  }

  const score = distance !== null
    ? distance < 100 ? "Spot on" : distance < 500 ? "Excellent" : distance < 1500 ? "Good" : distance < 3000 ? "Close" : "A long way off"
    : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 md:gap-8">
      <div ref={mapRef} className="relative z-0 w-full aspect-[16/10] border border-ink bg-paper-2 cursor-crosshair" />
      <div>
        <SectionLabel className="mb-3">GeoGuesser</SectionLabel>
        <p className="font-serif text-base leading-[1.55] text-ink-2 mb-2">{data.hint}</p>
        {data.region && <div className="font-sans text-sm text-meta mb-4">Region: {data.region}</div>}
        {!revealed ? (
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={handleReveal}
              disabled={!guess}
              className="w-full sm:w-auto min-h-11 font-sans font-semibold text-xs leading-none tracking-button uppercase bg-ink text-paper px-5 py-3.5 hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Submit guess
            </button>
            <span className="font-sans text-[13.5px] text-meta">
              {guess ? "Pin dropped. Move it by clicking again." : "No pin yet. Click the map."}
            </span>
          </div>
        ) : (
          <div className="border-t-2 border-ink bg-paper-2 px-4 pt-3.5 pb-4" aria-live="polite">
            <div className="font-display font-bold text-[19px] leading-[1.25]">{score}: {distance?.toLocaleString()} km away</div>
            <p className="font-sans text-[15px] sm:text-sm text-ink-3 mt-1">The answer was <b className="text-ink">{data.name}</b>.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GeoGuesser
