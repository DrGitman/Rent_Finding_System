import { AppShell } from "@/components/app-shell"
import { activities } from "@/lib/data"
import {
  Search,
  Activity as ActivityIcon,
  ShieldAlert,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react"

export default function ActivityPage() {
  return (
    <AppShell title="Activity">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success status-dot" />
            Real-time stream
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
            What your agents are doing right now.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuous log of scans, evaluations, and decisions.
          </p>
        </div>
        <div className="text-[11px] font-mono text-muted-foreground rounded-md border border-border px-2 py-1">
          12 events · last 6 hours
        </div>
      </header>

      <ol className="relative pl-5">
        <span
          className="absolute left-[10px] top-2 bottom-2 w-px activity-line"
          aria-hidden
        />
        {activities.map((a) => {
          const Icon =
            a.kind === "scan"
              ? Search
              : a.kind === "evaluate"
                ? ActivityIcon
                : a.kind === "scam"
                  ? ShieldAlert
                  : a.kind === "match"
                    ? Sparkles
                    : SettingsIcon
          const tone =
            a.kind === "scam"
              ? "bg-danger/10 text-danger ring-danger/20"
              : a.kind === "match"
                ? "bg-primary/10 text-primary ring-primary/20"
                : "bg-muted text-muted-foreground ring-border"
          return (
            <li key={a.id} className="relative pl-6 pb-5 last:pb-0">
              <span
                className={`absolute -left-[5px] top-0.5 size-5 rounded-full ring-2 ring-background grid place-items-center ${tone}`}
              >
                <Icon className="size-3" />
              </span>
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium leading-snug">
                    {a.message}
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                    {a.timestamp}
                  </span>
                </div>
                {a.detail && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.detail}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </AppShell>
  )
}
