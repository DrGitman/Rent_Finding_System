import { AppShell } from "@/components/app-shell"
import { listings } from "@/lib/data"
import { MapView } from "@/components/map-view"
import { Sparkles } from "lucide-react"

export default function MapPage() {
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
          Color-coded by AI score · scam-flagged listings excluded by default.
        </p>
      </header>

      <MapView listings={listings} />
    </AppShell>
  )
}
