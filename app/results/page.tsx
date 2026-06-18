import { AppShell } from "@/components/app-shell"
import { ListingCard } from "@/components/listing-card"
import { listings } from "@/lib/data"
import { Filter, Sparkles, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ResultsPage() {
  const ranked = [...listings].sort((a, b) => b.aiScore - a.aiScore)
  const topMatches = ranked.filter((l) => l.aiScore >= 85 && l.scamRisk === "low")
  const otherMatches = ranked.filter(
    (l) => !(l.aiScore >= 85 && l.scamRisk === "low"),
  )

  return (
    <AppShell title="Results">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Sparkles className="size-3 text-primary" />
            AI-curated output
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-balance">
            {ranked.length} rentals just for you.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Filtered, ranked, and scam-checked by your agents. Updated continuously.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <ArrowUpDown className="size-3.5" />
            Sort: AI score
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full">
            <Filter className="size-3.5" />
            Filter
          </Button>
        </div>
      </header>

      <section className="space-y-3 mb-10">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Top matches</h2>
          <span className="text-[11px] text-muted-foreground">
            ({topMatches.length})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topMatches.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Other evaluated</h2>
          <span className="text-[11px] text-muted-foreground">
            ({otherMatches.length})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherMatches.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
