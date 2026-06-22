"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { agents as agentsApi, notifications as notifApi, type BackendNotification, type Agent } from "@/lib/api"
import {
  Search,
  Activity as ActivityIcon,
  ShieldAlert,
  Sparkles,
  Settings as SettingsIcon,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
    message: n.title ?? "Agent activity",
    detail: n.description ?? undefined,
    timestamp: new Date(n.created_at).toLocaleString(),
  }
}

function agentToActivity(a: Agent): ActivityItem[] {
  const items: ActivityItem[] = []
  if (a.last_run) {
    items.push({
      id: `agent-${a.id}`,
      kind: "scan",
      message: `${a.name} completed a scan`,
      detail: `Source: ${a.source ?? "unknown"} · Status: ${a.status}`,
      timestamp: new Date(a.last_run).toLocaleString(),
    })
  }
  return items
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [notifs, agentList] = await Promise.all([
        notifApi.list({ limit: 30 }).catch(() => [] as BackendNotification[]),
        agentsApi.list().catch(() => [] as Agent[]),
      ])

      const fromNotifs = notifs.map(notifToActivity)
      const fromAgents = agentList.flatMap(agentToActivity)

      // Combine and sort by time, newest first
      const all = [...fromNotifs, ...fromAgents].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Deduplicate by id
      const seen = new Set<string>()
      setActivities(all.filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <AppShell title="Activity">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success status-dot" />
            Real-time stream
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
            {loading ? "Loading…" : "What your agents are doing."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuous log of scans, evaluations, and decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono text-muted-foreground rounded-md border border-border px-2 py-1">
            {activities.length} events
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={load}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No activity yet. Run a scan to get started.
        </div>
      ) : (
        <ol className="relative pl-5">
          <span className="absolute left-[10px] top-2 bottom-2 w-px activity-line" aria-hidden />
          {activities.map((a) => {
            const Icon =
              a.kind === "scan" ? Search :
              a.kind === "evaluate" ? ActivityIcon :
              a.kind === "scam" ? ShieldAlert :
              a.kind === "match" ? Sparkles : SettingsIcon

            const tone =
              a.kind === "scam" ? "bg-danger/10 text-danger ring-danger/20" :
              a.kind === "match" ? "bg-primary/10 text-primary ring-primary/20" :
              "bg-muted text-muted-foreground ring-border"

            return (
              <li key={a.id} className="relative pl-6 pb-5 last:pb-0">
                <span className={`absolute -left-[5px] top-0.5 size-5 rounded-full ring-2 ring-background grid place-items-center ${tone}`}>
                  <Icon className="size-3" />
                </span>
                <div className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium leading-snug">{a.message}</h3>
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                      {a.timestamp}
                    </span>
                  </div>
                  {a.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </AppShell>
  )
}
