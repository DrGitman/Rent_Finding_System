"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { MapView } from "@/components/map-view"
import { listings as listingsApi, backendListingToFrontend } from "@/lib/api"
import type { Listing } from "@/lib/data"
import { Sparkles, Loader2 } from "lucide-react"

export default function MapPage() {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listingsApi
      .list({ limit: 100 })
      .then((res) => {
        const mapped = res.listings
          .map(backendListingToFrontend)
          .filter((l) => l.scamRisk !== "high")
        setItems(mapped)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell title="Map">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" />
          AI-approved listings
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          Where your matches are.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Color-coded by AI score · scam-flagged listings excluded.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No listings to show yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Run a scan from your agents to populate the map.</p>
        </div>
      ) : (
        <MapView listings={items} />
      )}
    </AppShell>
  )
}
