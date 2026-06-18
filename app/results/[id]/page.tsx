import { AppShell } from "@/components/app-shell"
import { listings } from "@/lib/data"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  Bed,
  Bath,
  Maximize2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { AIScore, ScamRiskBadge } from "@/components/ai-score"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"
import { ListingMap } from "@/components/listing-map"

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = listings.find((l) => l.id === id)
  if (!listing) notFound()

  const similar = listings
    .filter((l) => l.id !== listing.id && l.scamRisk !== "high")
    .sort(
      (a, b) =>
        Math.abs(a.price - listing.price) - Math.abs(b.price - listing.price),
    )
    .slice(0, 3)

  return (
    <AppShell title={listing.title}>
      <Link
        href="/results"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to results
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT — gallery + map */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-4 relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              <Image
                src={listing.images[0] || "/placeholder.svg"}
                alt={listing.title}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
            {listing.images.slice(1, 5).map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <Image
                  src={src || "/placeholder.svg"}
                  alt={`${listing.title} photo ${i + 2}`}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Location</span>
              <span className="text-xs text-muted-foreground">
                · {listing.address}
              </span>
            </div>
            <div className="h-72">
              <ListingMap
                lat={listing.lat}
                lng={listing.lng}
                title={listing.title}
              />
            </div>
          </div>
        </div>

        {/* RIGHT — analysis */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                {listing.source}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                Found {listing.foundAt}
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {listing.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {listing.neighborhood}, {listing.city}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                ${listing.price.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AIScore score={listing.aiScore} size="lg" />
              <ScamRiskBadge risk={listing.scamRisk} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <FactCell icon={Bed} label="Bedrooms" value={listing.beds} />
              <FactCell icon={Bath} label="Bathrooms" value={listing.baths} />
              <FactCell
                icon={Maximize2}
                label="Square feet"
                value={listing.sqft.toLocaleString()}
              />
            </div>
          </div>

          {/* AI evaluation */}
          <Section
            icon={Sparkles}
            title="AI evaluation"
            tone="primary"
          >
            <p className="text-sm text-foreground leading-relaxed">
              {listing.reasoning}
            </p>
            {listing.highlights.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {listing.highlights.map((h) => (
                  <li
                    key={h}
                    className="text-xs flex items-center gap-2 text-foreground"
                  >
                    <Check className="size-3.5 text-success shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Price comparison */}
          <Section
            icon={listing.marketDelta < 0 ? TrendingDown : TrendingUp}
            title="Price vs. market"
            tone={listing.marketDelta < 0 ? "success" : "muted"}
          >
            <div className="flex items-baseline gap-3">
              <span
                className={`text-2xl font-semibold tabular-nums ${
                  listing.marketDelta < 0 ? "text-success" : "text-foreground"
                }`}
              >
                {listing.marketDelta > 0 ? "+" : ""}
                {listing.marketDelta.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs. comparable units
              </span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  listing.marketDelta < 0 ? "bg-success" : "bg-warning"
                }`}
                style={{
                  width: `${Math.min(Math.abs(listing.marketDelta) * 4, 100)}%`,
                }}
              />
            </div>
          </Section>

          {/* Scam analysis */}
          <Section
            icon={
              listing.scamRisk === "high"
                ? ShieldAlert
                : listing.scamRisk === "medium"
                  ? AlertTriangle
                  : ShieldCheck
            }
            title="Scam analysis"
            tone={
              listing.scamRisk === "high"
                ? "danger"
                : listing.scamRisk === "medium"
                  ? "warning"
                  : "success"
            }
          >
            {listing.scamSignals.length === 0 ? (
              <p className="text-sm text-foreground">
                No suspicious signals detected. Source verified.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {listing.scamSignals.map((s) => (
                  <li
                    key={s}
                    className="text-xs flex items-start gap-2 text-foreground"
                  >
                    <AlertTriangle className="size-3.5 mt-0.5 text-danger shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button className="flex-1 rounded-full">Contact listing</Button>
            <Button variant="outline" className="flex-1 rounded-full gap-2">
              <ExternalLink className="size-3.5" />
              Open source
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-12 space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Similar listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {similar.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}

function FactCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
  tone = "muted",
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
  tone?: "primary" | "danger" | "warning" | "success" | "muted"
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    muted: "bg-muted text-muted-foreground",
  }[tone]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`size-6 rounded-md grid place-items-center ${toneCls}`}>
          <Icon className="size-3.5" />
        </span>
        <h3 className="text-xs font-semibold tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  )
}
