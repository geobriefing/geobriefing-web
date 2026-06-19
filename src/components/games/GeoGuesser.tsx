"use client"
import { useEffect, useRef, useState } from "react"

interface GeoGuesserData {
  lat: number
  lon: number
  name: string
  hint: string
  region: string
}

export default function GeoGuesser({ data }: { data: GeoGuesserData }) {
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

      const map = L.map(mapRef.current, { zoomControl: true, tap: true }).setView([20, 40], 2)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap"
      }).addTo(map)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", (e: any) => {
        if (revealed) return
        const { lat, lng } = e.latlng
        setGuess({ lat, lon: lng })

        if (markerRef.current) markerRef.current.remove()
        markerRef.current = L.marker([lat, lng], {
          icon: L.divIcon({
            html: '<div style="width:12px;height:12px;background:#1a6b3c;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          })
        }).addTo(map)
      })

      mapInstanceRef.current = map
      setMapLoaded(true)

      // Ensure tiles render correctly if the map was created while its
      // container was hidden or mid-resize (common on mobile layouts).
      setTimeout(() => map.invalidateSize(), 200)
    }
    document.body.appendChild(script)
  }, [mapLoaded, revealed])

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const answerMarker = L.marker([data.lat, data.lon], {
      icon: L.divIcon({
        html: '<div style="width:14px;height:14px;background:#dc2626;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
    }).addTo(map).bindPopup(data.name).openPopup()

    L.polyline([[guess.lat, guess.lon], [data.lat, data.lon]], {
      color: "#1a6b3c", dashArray: "5,8", weight: 2
    }).addTo(map)

    map.fitBounds([[guess.lat, guess.lon], [data.lat, data.lon]], { padding: [40, 40] })
  }

  const score = distance !== null
    ? distance < 100 ? "Perfect!" : distance < 500 ? "Excellent" : distance < 1500 ? "Good" : distance < 3000 ? "Close" : "Try again"
    : null

  return (
    <div className="border border-gray-200">
      <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-4 py-3">
        <p className="text-xs font-sans font-bold text-[#1a6b3c] uppercase tracking-widest mb-0.5">Hint</p>
        <p className="text-sm font-sans text-gray-700">{data.hint}</p>
        <p className="text-xs font-sans text-gray-400 mt-0.5">Region: {data.region}</p>
      </div>
      <div ref={mapRef} className="w-full h-56 sm:h-72" />
      <div className="p-3 sm:p-4">
        {!revealed ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-xs font-sans text-gray-500 flex-1">
              {guess ? "Pin placed. Happy with your guess?" : "Tap the map to drop your pin."}
            </p>
            <button
              onClick={handleReveal}
              disabled={!guess}
              className="bg-[#1a1a1a] text-white text-xs font-sans font-bold tracking-widest uppercase px-4 py-2 hover:bg-[#1a6b3c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Reveal answer
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 px-4 py-3">
            <p className="text-sm font-bold mb-0.5">{score} — {distance?.toLocaleString()} km away</p>
            <p className="text-xs font-sans text-gray-600">The answer was <span className="font-bold">{data.name}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}