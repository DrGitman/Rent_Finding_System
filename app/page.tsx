"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ControlCenter } from "@/components/control-center"
import { listings as listingsApi, notifications as notifApi, backendListingToFrontend, type BackendNotification } from "@/lib/api"
import type { Listing } from "@/lib/data"
import { ListingCard } from "@/components/listing-card"
import Link from "next/link"
import { ArrowUpRight, Activity as ActivityIcon, ShieldAlert, Sparkles, Search, Bell } from "lucide-react"

interface ActivityItem {
  id: string
  kind: "scan" | "evaluate" | "scam" | "match" | "system"
  message: string
  detail?: string
  timestamp: string
}

function notifToActivity(n: BackendNotification): ActivityItem {
  const kind: ActivityItem["kind"] =
    n.notification_type === "scam_alert" ? "scam" :
    n.notification_type === "new_match" ? "match" :
    n.notification_type === "scan_complete" ? "scan" :
    n.notification_type === "evaluation_complete" ? "evaluate" : "system"

  return {
    id: String(n.id),
    kind,
    message: n.title ?? "Activity",
    detail: n.description ?? undefined,
    timestamp: new Date(n.created_at).toLocaleString(),
  }
}

export default function HomePage() {
  const [top, setTop] = useState<Listing[]>([])
  const [recent, setRecent] = useState<ActivityItem[]>([])

  useEffect(() => {
    listingsApi
      .list({ ai_score_min: 70, limit: 3, sort_by: "-ai_score" })
      .then((res) => {
        const mapped = res.listings
          .map(backendListingToFrontend)
          .filter((l) => l.scamRisk !== "high")
          .sort((a, b) => b.aiScore - a.aiScore)
          .slice(0, 3)
        setTop(mapped)
      })
      .catch(() => {})

    notifApi
      .list({ limit: 8 })
      .then((notifs) => setRecent(notifs.map(notifToActivity)))
      .catch(() => {})
  }, [])

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
          {top.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Sparkles className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No listings yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Trigger a scan from your agents to discover rentals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {top.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
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
            {recent.length === 0 ? (
              <li className="p-6 text-center">
                <Bell className="size-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No activity yet</p>
              </li>
            ) : recent.map((a) => {
              const Icon =
                a.kind === "scan" ? Search :
                a.kind === "evaluate" ? ActivityIcon :
                a.kind === "scam" ? ShieldAlert :
                a.kind === "match" ? Sparkles : ActivityIcon
              const tone =
                a.kind === "scam" ? "text-danger bg-danger/10" :
                a.kind === "match" ? "text-primary bg-primary/10" :
                "text-muted-foreground bg-muted"
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
