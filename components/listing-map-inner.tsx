"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet"

export default function ListingMapInner({
  lat,
  lng,
  title,
}: {
  lat: number
  lng: number
  title?: string
}) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        pathOptions={{
          color: "#ff5a1f",
          fillColor: "#ff5a1f",
          fillOpacity: 0.85,
          weight: 3,
          opacity: 1,
        }}
      >
        {title && <Tooltip permanent direction="top" offset={[0, -10]}>{title}</Tooltip>}
      </CircleMarker>
    </MapContainer>
  )
}
