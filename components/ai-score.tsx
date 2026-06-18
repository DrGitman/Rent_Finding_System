import { cn } from "@/lib/utils"
import type { ScamRisk } from "@/lib/data"

export function AIScore({
  score,
  size = "md",
}: {
  score: number
  size?: "sm" | "md" | "lg"
}) {
  const tone =
    score >= 85
      ? "text-primary border-primary/30 bg-primary/10"
      : score >= 70
        ? "text-foreground border-border bg-muted"
        : "text-danger border-danger/30 bg-danger/10"

  const sizes = {
    sm: "text-[11px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
    lg: "text-sm px-2.5 py-1 gap-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-mono font-medium tabular-nums",
        tone,
        sizes[size],
      )}
      aria-label={`AI score ${score}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      <span>{score}</span>
      <span className="opacity-50">/100</span>
    </span>
  )
}

export function ScamRiskBadge({
  risk,
  size = "md",
}: {
  risk: ScamRisk
  size?: "sm" | "md"
}) {
  const map = {
    low: { label: "Low risk", cls: "text-success border-success/30 bg-success/10" },
    medium: {
      label: "Medium risk",
      cls: "text-warning border-warning/30 bg-warning/10",
    },
    high: { label: "High risk", cls: "text-danger border-danger/30 bg-danger/10" },
  }
  const meta = map[risk]
  const sizes = {
    sm: "text-[11px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        meta.cls,
        sizes[size],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  )
}
