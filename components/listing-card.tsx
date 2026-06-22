"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { MapPin, Bed, Bath, Maximize2, ExternalLink } from "lucide-react"
import type { Listing } from "@/lib/data"
import { AIScore, ScamRiskBadge } from "./ai-score"

// Source label display names
const SOURCE_LABELS: Record<string, string> = {
  facebook_marketplace: "Facebook",
  zillow: "Zillow",
  apartments: "Apartments.com",
  craigslist: "Craigslist",
  whatsapp_group: "WhatsApp",
  whatsapp_groups: "WhatsApp",
}

export function ListingCard({ listing }: { listing: Listing }) {
  const [imgError, setImgError] = useState(false)

  const imgSrc =
    !imgError && listing.image && listing.image !== "/listings/apt-1.jpg"
      ? listing.image
      : null

  const sourceLabel = SOURCE_LABELS[listing.source?.toLowerCase() ?? ""] ?? listing.source ?? "Unknown"

  // If the listing has an external URL, open it directly; otherwise go to detail
  const href = `/results/${listing.id}`

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={listing.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          // Placeholder with source label
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-muted to-muted/60">
            <div className="text-2xl font-bold text-muted-foreground/30 tracking-tighter">
              {sourceLabel.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] text-muted-foreground/60">{sourceLabel}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5">
          <AIScore score={listing.aiScore} size="sm" />
        </div>
        <div className="absolute top-2.5 right-2.5">
          <ScamRiskBadge risk={listing.scamRisk} size="sm" />
        </div>

        {/* Source badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-white backdrop-blur-sm">
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-pretty truncate">{listing.title}</h3>
            {(listing.neighborhood || listing.city || listing.address) && (
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 truncate">
                <MapPin className="size-3 shrink-0" />
                {[listing.neighborhood, listing.city, listing.address].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            {listing.price > 0 ? (
              <>
                <div className="text-sm font-semibold tabular-nums">
                  R{listing.price.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted-foreground">/ month</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">Price TBD</div>
            )}
          </div>
        </div>

        {/* Beds / Baths / Sqft — only show if data exists */}
        {(listing.beds > 0 || listing.baths > 0 || listing.sqft > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {listing.beds > 0 && (
              <span className="inline-flex items-center gap-1">
                <Bed className="size-3.5" /> {listing.beds} bd
              </span>
            )}
            {listing.baths > 0 && (
              <span className="inline-flex items-center gap-1">
                <Bath className="size-3.5" /> {listing.baths} ba
              </span>
            )}
            {listing.sqft > 0 && (
              <span className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" /> {listing.sqft} ft²
              </span>
            )}
          </div>
        )}

        {listing.reasoning && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 border-t border-border pt-3">
            {listing.reasoning}
          </p>
        )}
      </div>
    </Link>
  )
}
