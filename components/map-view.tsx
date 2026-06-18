"use client"

import dynamic from "next/dynamic"
import type { Listing } from "@/lib/data"
import { useState } from "react"
import { AIScore, ScamRiskBadge } from "./ai-score"
import { Bed, Bath, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const FullMap = dynamic(() => import("./full-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="size-full grid place-items-center text-xs text-muted-foreground bg-muted/40">
      Loading map…
    </div>
  ),
})

export function MapView({ listings }: { listings: Listing[] }) {
  const visible = listings.filter((l) => l.scamRisk !== "high")
  const [selectedId, setSelectedId] = useState<string>(visible[0]?.id ?? "")
  const selected = visible.find((l) => l.id === selectedId) ?? visible[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)] min-h-[560px]">
      {/* Listing rail */}
      <aside className="lg:col-span-4 xl:col-span-3 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-medium">{visible.length} matches</span>
          <span className="text-[11px] text-muted-foreground">on map</span>
        </div>
        <ul className="overflow-y-auto divide-y divide-border">
          {visible.map((l) => (
            <li key={l.id}>
              <button
                onClick={() => setSelectedId(l.id)}
                className={`w-full text-left flex gap-3 p-3 transition-colors ${
                  selectedId === l.id
                    ? "bg-primary/5"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="relative size-16 rounded-md overflow-hidden bg-muted shrink-0">
                  <Image
                    src={l.image || "/placeholder.svg"}
                    alt={l.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <AIScore score={l.aiScore} size="sm" />
                  </div>
                  <h3 className="mt-1 text-xs font-semibold truncate">{l.title}</h3>
                  <p className="text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                    <MapPin className="size-2.5" /> {l.neighborhood}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground tabular-nums">
                      ${l.price.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Bed className="size-2.5" /> {l.beds}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Bath className="size-2.5" /> {l.baths}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Map */}
      <div className="lg:col-span-8 xl:col-span-9 relative rounded-xl border border-border overflow-hidden">
        <FullMap
          listings={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {/* Legend */}
        <div className="absolute top-3 left-3 z-[400] rounded-lg border border-border bg-card/95 backdrop-blur px-3 py-2 text-[11px] flex items-center gap-3 shadow-sm">
          <span className="font-medium">AI score</span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-primary" /> 85+
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-warning" /> 70–84
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-muted-foreground" /> &lt;70
          </span>
        </div>

        {/* Selected card */}
        {selected && (
          <Link
            href={`/results/${selected.id}`}
            className="absolute bottom-3 left-3 right-3 md:right-auto md:w-80 z-[400] rounded-xl border border-border bg-card overflow-hidden shadow-lg hover:border-foreground/20 transition"
          >
            <div className="flex">
              <div className="relative w-28 aspect-square shrink-0 bg-muted">
                <Image
                  src={selected.image || "/placeholder.svg"}
                  alt={selected.title}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <div className="p-3 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <AIScore score={selected.aiScore} size="sm" />
                  <ScamRiskBadge risk={selected.scamRisk} size="sm" />
                </div>
                <h3 className="mt-1.5 text-sm font-semibold truncate">
                  {selected.title}
                </h3>
                <p className="text-[11px] text-muted-foreground truncate">
                  {selected.neighborhood}, {selected.city}
                </p>
                <div className="mt-1.5 text-sm font-semibold tabular-nums">
                  ${selected.price.toLocaleString()}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {" "}
                    / mo
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  )
}
