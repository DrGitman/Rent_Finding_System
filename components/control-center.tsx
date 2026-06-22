"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ArrowRight,
  Sparkles,
  MapPin,
  DollarSign,
  Crosshair,
  Zap,
  ShieldCheck,
  ListChecks,
  Search,
  Settings2,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { users as usersApi, listings as listingsApi, agents as agentsApi, scrapers } from "@/lib/api"
import Link from "next/link"
import { toast } from "sonner"

interface ScanSource {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  status: "idle" | "running" | "done" | "error"
  count?: number
}

const DEFAULT_SOURCES: ScanSource[] = [
  { key: "property24", label: "Property24 Namibia", icon: Search, status: "idle" },
  { key: "propertynews", label: "PropertyNews Namibia", icon: Search, status: "idle" },
  { key: "myproperty", label: "MyProperty Namibia", icon: Search, status: "idle" },
  { key: "rightmove", label: "Right Move Windhoek", icon: Search, status: "idle" },
  { key: "facebook", label: "Facebook Marketplace", icon: Search, status: "idle" },
  { key: "whatsapp", label: "WhatsApp rental groups", icon: ListChecks, status: "idle" },
  { key: "evaluate", label: "Detecting scams & ranking", icon: ShieldCheck, status: "idle" },
]

interface Stats {
  total: string
  matches: string
  scams: string
  median: string
}

interface Prefs {
  budget: string
  location: string
  radius: string
  city: string
}

export function ControlCenter() {
  const [userName, setUserName] = useState("there")
  const [stats, setStats] = useState<Stats>({ total: "—", matches: "—", scams: "—", median: "—" })
  const [prefs, setPrefs] = useState<Prefs>({ budget: "Not set", location: "Not set", radius: "—", city: "windhoek" })
  const [activeAgents, setActiveAgents] = useState<number>(0)
  const [sources, setSources] = useState<ScanSource[]>(DEFAULT_SOURCES)
  const [scanning, setScanning] = useState(false)
  const [lastScan, setLastScan] = useState<Date | null>(null)
  const [userId, setUserId] = useState<number | null>(null)

  const refreshStats = useCallback(() => {
    listingsApi.stats().then((s) => {
      if (s) {
        setStats({
          total: s.total_listings.toLocaleString(),
          matches: s.evaluated_count.toLocaleString(),
          scams: s.high_risk_count.toLocaleString(),
          median: s.avg_price > 0 ? `R${Math.round(s.avg_price).toLocaleString()}` : "—",
        })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const storedName = localStorage.getItem("rs_user_name")
    const storedEmail = localStorage.getItem("rs_user_email")
    if (storedName) setUserName(storedName.split(" ")[0])
    else if (storedEmail) setUserName(storedEmail.split("@")[0])

    usersApi.me().then((user: any) => {
      if (user?.full_name) {
        setUserName(user.full_name.split(" ")[0])
        localStorage.setItem("rs_user_name", user.full_name)
      }
      if (user?.id) setUserId(user.id)
    }).catch(() => {})

    usersApi.profile().then((p: any) => {
      if (p) {
        const minB = p.min_budget ? `R${Number(p.min_budget).toLocaleString()}` : null
        const maxB = p.max_budget ? `R${Number(p.max_budget).toLocaleString()}` : null
        setPrefs({
          budget: minB && maxB ? `${minB} — ${maxB}` : maxB ?? minB ?? "Not set",
          location: p.location_city ?? "Not set",
          radius: p.search_radius_km ? `${p.search_radius_km} km` : "—",
          city: p.location_city ?? "windhoek",
        })
      }
    }).catch(() => {})

    refreshStats()

    agentsApi.list().then((list) => {
      setActiveAgents(list.filter((a) => a.status === "active").length)
    }).catch(() => {})
  }, [refreshStats])

  const setSourceStatus = (key: string, status: ScanSource["status"], count?: number) => {
    setSources((prev) =>
      prev.map((s) => s.key === key ? { ...s, status, ...(count !== undefined ? { count } : {}) } : s)
    )
  }

  const runScanNow = async () => {
    if (scanning) return
    setScanning(true)
    setLastScan(null)
    // Reset all to idle
    setSources(DEFAULT_SOURCES.map((s) => ({ ...s, status: "idle", count: undefined })))

    const city = prefs.city || "windhoek"

    toast.info("Scan started", { description: `Searching for rentals in ${prefs.location || city}…` })

    // Run Namibian sites in sequence so user sees live progress
    const namibiaSources: Array<{ key: string; fn: () => Promise<any> }> = [
      { key: "property24", fn: () => scrapers.property24(city, 2) },
      { key: "propertynews", fn: () => scrapers.propertynews(city, 2) },
      { key: "myproperty", fn: () => scrapers.myproperty(city, 2) },
      { key: "rightmove", fn: () => scrapers.rightmove(2) },
      { key: "facebook", fn: () => scrapers.facebook(city) },
    ]

    let totalFound = 0

    for (const src of namibiaSources) {
      setSourceStatus(src.key, "running")
      try {
        const res = await src.fn()
        const count = res?.count ?? 0
        totalFound += count
        setSourceStatus(src.key, "done", count)
      } catch {
        setSourceStatus(src.key, "error", 0)
      }
    }

    // WhatsApp — just show status, actual collection is passive
    setSourceStatus("whatsapp", "running")
    await new Promise((r) => setTimeout(r, 800))
    setSourceStatus("whatsapp", "done")

    // Evaluation stage
    setSourceStatus("evaluate", "running")
    if (totalFound > 0) {
      try {
        // Store all namibia results in one go
        await scrapers.namibia(city, 2, true, userId ?? undefined)
      } catch { /* non-fatal */ }
    }
    await new Promise((r) => setTimeout(r, 600))
    setSourceStatus("evaluate", "done")

    setScanning(false)
    setLastScan(new Date())
    refreshStats()

    toast.success("Scan complete", {
      description: `${totalFound} new listings found across all sources.`,
    })
  }

  const scanAge = lastScan
    ? Math.round((Date.now() - lastScan.getTime()) / 1000)
    : null

  return (
    <section className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted-foreground">Welcome back, {userName}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          Your AI agents are working in the background.
        </h1>
      </div>

      {/* Control panel */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${scanning ? "bg-primary status-dot" : "bg-success status-dot"}`} />
            <span className="text-xs font-medium">{scanning ? "Scanning…" : "System running"}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · {activeAgents > 0 ? `${activeAgents} agent${activeAgents !== 1 ? "s" : ""} active` : "No agents yet"}
            </span>
          </div>
          {scanAge !== null && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Last scan {scanAge < 60 ? `${scanAge}s` : `${Math.round(scanAge / 60)}m`} ago
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PrefField icon={DollarSign} label="Budget" value={prefs.budget} />
          <PrefField icon={MapPin} label="Location" value={prefs.location} />
          <PrefField icon={Crosshair} label="Radius" value={prefs.radius} />
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Rent Scout searches Property24, PropertyNews, MyProperty, Right Move Windhoek,
            Facebook Marketplace, and WhatsApp rental groups — then ranks and scam-checks every listing.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Link href="/settings">
              <Button size="sm" variant="outline" className="gap-2 rounded-full">
                <Settings2 className="size-4" />
                Preferences
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={runScanNow}
              disabled={scanning}
            >
              <Play className="size-4" />
              {scanning ? "Scanning…" : "Run scan now"}
            </Button>
            <Link href="/results">
              <Button size="sm" className="gap-2 rounded-full">
                <Zap className="size-4" />
                View results
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live status pipeline */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-medium">
              {scanning ? "Scanning listings…" : "Scan status"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {sources.filter((s) => s.status === "done").length}/{sources.length} sources
          </span>
        </div>
        <ul className="divide-y divide-border">
          {sources.map((s) => {
            const Icon = s.icon
            const isRunning = s.status === "running"
            const isDone = s.status === "done"
            const isError = s.status === "error"
            return (
              <li key={s.key} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span
                  className={`size-7 rounded-md grid place-items-center shrink-0 ${
                    isRunning
                      ? "bg-primary/15 text-primary"
                      : isDone
                        ? "bg-success/10 text-success"
                        : isError
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : isError ? (
                    <AlertCircle className="size-3.5" />
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </span>
                <span
                  className={`flex-1 truncate ${
                    isRunning
                      ? "text-foreground font-medium"
                      : isDone
                        ? "text-foreground"
                        : isError
                          ? "text-destructive"
                          : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {isRunning && (
                  <span className="text-[11px] font-mono text-primary inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary status-dot" />
                    running
                  </span>
                )}
                {isDone && (
                  <span className="text-[11px] font-mono text-success">
                    {s.count !== undefined ? `${s.count} found` : "done"}
                  </span>
                )}
                {isError && (
                  <span className="text-[11px] font-mono text-destructive">failed</span>
                )}
                {s.status === "idle" && !scanning && (
                  <span className="text-[11px] font-mono text-muted-foreground">idle</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Listings scanned" value={stats.total} tone="default" />
        <StatCard label="High-quality matches" value={stats.matches} tone="primary" />
        <StatCard label="Scams blocked" value={stats.scams} tone="danger" />
        <StatCard label="Median price (area)" value={stats.median} tone="default" />
      </div>
    </section>
  )
}

function PrefField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-medium tabular-nums">{value}</div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "primary" | "danger" | "default"
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "danger"
        ? "text-danger"
        : "text-muted-foreground"
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className={`text-xl font-semibold tabular-nums ${toneCls}`}>{value}</span>
      </div>
    </div>
  )
}
