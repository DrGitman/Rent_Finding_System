"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ControlCenter } from "@/components/control-center"
import { listings as mockListings, activities as mockActivities, type Activity } from "@/lib/data"
import { listings as listingsApi, backendListingToFrontend, type BackendListing } from "@/lib/api"
import type { Listing } from "@/lib/data"
import { ListingCard } from "@/components/listing-card"
import Link from "next/link"
import { ArrowUpRight, Activity as ActivityIcon, ShieldAlert, Sparkles, Search } from "lucide-react"

export default function HomePage() {
  const [top, setTop] = useState<Listing[]>([])
  const [recent, setRecent] = useState<Activity[]>([])

  useEffect(() => {
    // Try to load real listings; fall back to mock data
    listingsApi
      .list({ min_ai_score: 70, limit: 3 })
      .then((data: BackendListing[]) => {
        const mapped = data
          .map(backendListingToFrontend)
          .filter((l) => l.scamRisk !== "high")
          .sort((a, b) => b.aiScore - a.aiScore)
          .slice(0, 3)
        setTop(mapped.length ? mapped : mockTop)
      })
      .catch(() => setTop(mockTop))

    // Activity feed stays on mock data until a global activities endpoint exists
    setRecent(mockActivities.slice(0, 6))
  }, [])

  const mockTop = [...mockListings]
    .filter((l) => l.scamRisk !== "high")
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 3)

  return (
    <AppShell title="Home">
      <ControlCenter />

      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Latest matches</h2>
            <Link
              href="/results"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(top.length ? top : mockTop).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Live activity</h2>
            <Link
              href="/activity"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Open feed <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <ul className="rounded-xl border border-border bg-card divide-y divide-border">
            {recent.map((a) => {
              const Icon =
                a.kind === "scan"
                  ? Search
                  : a.kind === "evaluate"
                    ? ActivityIcon
                    : a.kind === "scam"
                      ? ShieldAlert
                      : a.kind === "match"
                        ? Sparkles
                        : ActivityIcon
              const tone =
                a.kind === "scam"
                  ? "text-danger bg-danger/10"
                  : a.kind === "match"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground bg-muted"
              return (
                <li key={a.id} className="flex items-start gap-3 p-3.5">
                  <span className={`size-7 rounded-md grid place-items-center shrink-0 ${tone}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug truncate">{a.message}</p>
                    {a.detail && (
                      <p className="text-[11px] text-muted-foreground truncate">{a.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {a.timestamp}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </AppShell>
  )
}
