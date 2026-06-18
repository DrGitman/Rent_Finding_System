"use client"

import { AppShell } from "@/components/app-shell"
import { useEffect, useState } from "react"
import { Sparkles, ShieldAlert, Settings as SettingsIcon, Inbox, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { notifications as notifApi, type BackendNotification } from "@/lib/api"

const filters = [
  { key: "all", label: "All" },
  { key: "deal", label: "Deals" },
  { key: "scam", label: "Scams" },
  { key: "system", label: "System" },
] as const

type Filter = (typeof filters)[number]["key"]

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function NotificationsPage() {
  const [active, setActive] = useState<Filter>("all")
  const [items, setItems] = useState<BackendNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    notifApi.list({ limit: 100 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const markRead = async (id: number) => {
    await notifApi.markRead(id).catch(() => null)
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const filtered = active === "all"
    ? items
    : items.filter((n) => n.notification_type === active)

  const unread = items.filter((n) => !n.is_read).length

  return (
    <AppShell title="Notifications">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Inbox className="size-3" />
          {unread} unread
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          Notifications
        </h1>
      </header>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActive(f.key)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              active === f.key
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <ul className="rounded-xl border border-border bg-card divide-y divide-border">
          {filtered.map((n) => {
            const type = n.notification_type ?? "system"
            const Icon =
              type === "deal" || type === "match"
                ? Sparkles
                : type === "scam"
                  ? ShieldAlert
                  : SettingsIcon
            const tone =
              type === "deal" || type === "match"
                ? "bg-primary/10 text-primary"
                : type === "scam"
                  ? "bg-danger/10 text-danger"
                  : "bg-muted text-muted-foreground"

            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors cursor-pointer",
                  !n.is_read && "bg-primary/[0.025]",
                )}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                <span className={`size-9 rounded-lg grid place-items-center shrink-0 ${tone}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold tracking-tight truncate">
                      {n.title ?? "Notification"}
                    </h3>
                    {!n.is_read && (
                      <span className="size-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                    {n.description}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                  {relativeTime(n.created_at)}
                </span>
              </li>
            )
          })}
          {filtered.length === 0 && (
            <li className="p-10 text-center text-sm text-muted-foreground">
              No notifications in this category.
            </li>
          )}
        </ul>
      )}
    </AppShell>
  )
}
