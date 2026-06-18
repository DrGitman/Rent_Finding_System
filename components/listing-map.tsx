"use client"

import dynamic from "next/dynamic"

const MapInner = dynamic(() => import("./listing-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="size-full grid place-items-center bg-muted/40 text-xs text-muted-foreground">
      Loading map…
    </div>
  ),
})

export function ListingMap(props: {
  lat: number
  lng: number
  title?: string
}) {
  return <MapInner {...props} />
}
