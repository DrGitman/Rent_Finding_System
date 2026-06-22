"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ListingCard } from "@/components/listing-card"
import { listings as listingsApi, backendListingToFrontend } from "@/lib/api"
import type { Listing } from "@/lib/data"
import { Sparkles, ArrowUpDown, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type SortKey = "ai_score" | "price_asc" | "price_desc" | "date"

export default function ResultsPage() {
  const [all, setAll] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortKey>("ai_score")

  const loadListings = () => {
    setLoading(true)
    listingsApi
      .list({ limit: 100 })
      .then((res) => setAll(res.listings.map(backendListingToFrontend)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadListings() }, [])

  const sorted = [...all].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price
    if (sortBy === "price_desc") return b.price - a.price
    if (sortBy === "date") return b.foundAt.localeCompare(a.foundAt)
    return b.aiScore - a.aiScore
  })

  const topMatches = sorted.filter((l) => l.aiScore >= 70 && l.scamRisk !== "high")
  const otherMatches = sorted.filter((l) => !(l.aiScore >= 70 && l.scamRisk !== "high"))

  const sortLabel =
    sortBy === "ai_score" ? "AI score" :
    sortBy === "price_asc" ? "Price ↑" :
    sortBy === "price_desc" ? "Price ↓" : "Newest"

  const cycleSortBy = () => {
    const cycle: SortKey[] = ["ai_score", "price_asc", "price_desc", "date"]
    setSortBy((s) => cycle[(cycle.indexOf(s) + 1) % cycle.length])
  }

  return (
    <AppShell title="Results">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" />
            AI-curated output
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
            {loading ? "Loading rentals…" : `${sorted.length} rental${sorted.length !== 1 ? "s" : ""} found.`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtered, ranked, and scam-checked by your agents. Updated continuously.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={cycleSortBy}>
            <ArrowUpDown className="size-3.5" />
            Sort: {sortLabel}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={loadListings}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : all.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-sm text-muted-foreground">No listings yet.</p>
          <p className="text-xs text-muted-foreground">
            Trigger a scan from your dashboard to start discovering rentals.
          </p>
        </div>
      ) : (
        <>
          {topMatches.length > 0 && (
            <section className="space-y-3 mb-10">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">Top matches</h2>
                <span className="text-[11px] text-muted-foreground">({topMatches.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topMatches.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}
          {otherMatches.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight">Other listings</h2>
                <span className="text-[11px] text-muted-foreground">({otherMatches.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherMatches.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
