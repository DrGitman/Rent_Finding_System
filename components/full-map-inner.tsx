"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet"
import type { Listing } from "@/lib/data"

function colorFor(score: number) {
  if (score >= 85) return "oklch(0.68 0.19 41)" // primary orange
  if (score >= 70) return "oklch(0.78 0.16 75)" // amber
  return "oklch(0.55 0.02 60)" // muted
}

export default function FullMapInner({
  listings,
  selectedId,
  onSelect,
}: {
  listings: Listing[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const center: [number, number] =
    listings.length > 0
      ? [
          listings.reduce((s, l) => s + l.lat, 0) / listings.length,
          listings.reduce((s, l) => s + l.lng, 0) / listings.length,
        ]
      : [40.7128, -74.006]

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {listings.map((l) => {
        const isSelected = l.id === selectedId
        const c = colorFor(l.aiScore)
        return (
          <CircleMarker
            key={l.id}
            center={[l.lat, l.lng]}
            radius={isSelected ? 14 : 9}
            pathOptions={{
              color: c,
              fillColor: c,
              fillOpacity: isSelected ? 0.9 : 0.7,
              weight: isSelected ? 3 : 2,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => onSelect(l.id),
            }}
          />
        )
      })}
    </MapContainer>
  )
}
