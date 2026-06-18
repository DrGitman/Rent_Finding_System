"use client"

import { useEffect, useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"

const stages = [
  { label: "Scanning Facebook Marketplace", source: "fb", icon: Search },
  { label: "Scanning Zillow & Trulia", source: "zillow", icon: Search },
  { label: "Pulling from trusted WhatsApp groups", source: "wa", icon: Search },
  { label: "Evaluating 247 listings", source: "eval", icon: ListChecks },
  { label: "Detecting scams & duplicates", source: "scam", icon: ShieldCheck },
  { label: "Ranking best matches", source: "rank", icon: Sparkles },
]

export function ControlCenter() {
  const [stage, setStage] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setStage((s) => (s + 1) % stages.length)
    }, 2200)
    return () => clearInterval(id)
  }, [running])

  return (
    <section className="space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-xs text-muted-foreground">Welcome back, Tawhid</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          Your AI agents are working in the background.
        </h1>
      </div>

      {/* Control panel */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success status-dot" />
            <span className="text-xs font-medium">System running</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · 6 sources monitored · last scan 12s ago
            </span>
          </div>
          <button
            onClick={() => setRunning((r) => !r)}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            {running ? "Pause agents" : "Resume agents"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PrefField icon={DollarSign} label="Budget" value="$1,800 — $3,200" />
          <PrefField icon={MapPin} label="Location" value="Brooklyn, NY" />
          <PrefField icon={Crosshair} label="Radius" value="5 km" />
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
            Set your preferences once. Renta will continuously search, evaluate, flag
            scams, and surface only the best matches.
          </p>
          <Button size="lg" className="gap-2 rounded-full">
            <Zap className="size-4" />
            Find rentals
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Live status pipeline */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-xs font-medium">AI agents are scanning listings</span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            v1.4.2 · n8n
          </span>
        </div>
        <ul className="divide-y divide-border">
          {stages.map((s, i) => {
            const isActive = i === stage
            const isDone = i < stage
            const Icon = s.icon
            return (
              <li
                key={s.source}
                className="flex items-center gap-3 px-5 py-3 text-sm"
              >
                <span
                  className={`size-7 rounded-md grid place-items-center shrink-0 ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : isDone
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                </span>
                <span
                  className={`flex-1 truncate ${
                    isActive
                      ? "text-foreground font-medium"
                      : isDone
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
                {isActive && (
                  <span className="text-[11px] font-mono text-primary inline-flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary status-dot" />
                    running
                  </span>
                )}
                {isDone && (
                  <span className="text-[11px] font-mono text-success">done</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Listings scanned today" value="1,284" delta="+12%" />
        <StatCard label="High-quality matches" value="14" delta="+3" tone="primary" />
        <StatCard label="Scams blocked" value="22" delta="+5" tone="danger" />
        <StatCard label="Median price (area)" value="$2,790" delta="-1.2%" />
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
  delta,
  tone,
}: {
  label: string
  value: string
  delta: string
  tone?: "primary" | "danger"
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
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className={`text-[11px] font-mono ${toneCls}`}>{delta}</span>
      </div>
    </div>
  )
}
