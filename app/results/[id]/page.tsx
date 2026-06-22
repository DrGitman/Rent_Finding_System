"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { listings as listingsApi, backendListingToFrontend } from "@/lib/api"
import type { Listing } from "@/lib/data"
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
  Loader2,
} from "lucide-react"
import { AIScore, ScamRiskBadge } from "@/components/ai-score"
import { ListingCard } from "@/components/listing-card"
import { Button } from "@/components/ui/button"

export default function ListingDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [similar, setSimilar] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    listingsApi.get(id)
      .then((raw) => {
        setListing(backendListingToFrontend(raw))
        // Fetch similar listings — same source or nearby price
        return listingsApi.list({ limit: 20 })
      })
      .then((res) => {
        const current = res.listings.find((l) => String(l.id) === id)
        const currentPrice = current?.price ?? 0
        const mapped = res.listings
          .filter((l) => String(l.id) !== id && (l.scam_risk ?? 0) < 70)
          .map(backendListingToFrontend)
          .sort((a, b) => Math.abs(a.price - currentPrice) - Math.abs(b.price - currentPrice))
          .slice(0, 3)
        setSimilar(mapped)
      })
      .catch((err) => {
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          setNotFound(true)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AppShell title="Loading…">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  if (notFound || !listing) {
    return (
      <AppShell title="Not found">
        <div className="text-center py-32">
          <p className="text-sm text-muted-foreground">Listing not found or has been removed.</p>
          <Link href="/results" className="mt-4 inline-block text-xs text-primary hover:underline">
            Back to results
          </Link>
        </div>
      </AppShell>
    )
  }

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
        {/* LEFT — image + source link */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            {listing.image ? (
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                priority
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/60">
                <span className="text-4xl font-bold text-muted-foreground/20">
                  {listing.source.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground/50">{listing.source}</span>
              </div>
            )}
          </div>

          {listing.url && (
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              View original listing on {listing.source}
            </a>
          )}
        </div>

        {/* RIGHT — details */}
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

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">
                {listing.price > 0 ? `R${listing.price.toLocaleString()}` : "Price TBD"}
              </span>
              {listing.price > 0 && <span className="text-sm text-muted-foreground">/ month</span>}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AIScore score={listing.aiScore} size="lg" />
              <ScamRiskBadge risk={listing.scamRisk} />
            </div>

            {(listing.beds > 0 || listing.baths > 0 || listing.sqft > 0) && (
              <div className="mt-5 grid grid-cols-3 gap-3">
                {listing.beds > 0 && <FactCell icon={Bed} label="Bedrooms" value={listing.beds} />}
                {listing.baths > 0 && <FactCell icon={Bath} label="Bathrooms" value={listing.baths} />}
                {listing.sqft > 0 && <FactCell icon={Maximize2} label="Sq ft" value={listing.sqft.toLocaleString()} />}
              </div>
            )}
          </div>

          {/* AI evaluation */}
          {listing.reasoning && (
            <Section icon={Sparkles} title="AI evaluation" tone="primary">
              <p className="text-sm text-foreground leading-relaxed">{listing.reasoning}</p>
              {listing.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {listing.highlights.map((h) => (
                    <li key={h} className="text-xs flex items-center gap-2 text-foreground">
                      <Check className="size-3.5 text-success shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {/* Scam analysis */}
          <Section
            icon={listing.scamRisk === "high" ? ShieldAlert : listing.scamRisk === "medium" ? AlertTriangle : ShieldCheck}
            title="Scam analysis"
            tone={listing.scamRisk === "high" ? "danger" : listing.scamRisk === "medium" ? "warning" : "success"}
          >
            {listing.scamSignals.length === 0 ? (
              <p className="text-sm text-foreground">No suspicious signals detected.</p>
            ) : (
              <ul className="space-y-1.5">
                {listing.scamSignals.map((s) => (
                  <li key={s} className="text-xs flex items-start gap-2 text-foreground">
                    <AlertTriangle className="size-3.5 mt-0.5 text-danger shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {listing.url && (
              <Button asChild className="flex-1 rounded-full">
                <a href={listing.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5 mr-2" />
                  Open listing
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => router.back()} className="flex-1 rounded-full gap-2">
              <ArrowLeft className="size-3.5" />
              Go back
            </Button>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 space-y-3">
          <h2 className="text-sm font-semibold tracking-tight">Similar listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </AppShell>
  )
}

function FactCell({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3" />{label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function Section({ icon: Icon, title, children, tone = "muted" }: {
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
