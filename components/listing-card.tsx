import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Bath, Maximize2 } from "lucide-react"
import type { Listing } from "@/lib/data"
import { AIScore, ScamRiskBadge } from "./ai-score"

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/results/${listing.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={listing.image || "/placeholder.svg"}
          alt={listing.title}
          fill
          sizes="(max-width:768px) 100vw, 33vw"
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <div className="absolute top-2.5 left-2.5">
          <AIScore score={listing.aiScore} size="sm" />
        </div>
        <div className="absolute top-2.5 right-2.5">
          <ScamRiskBadge risk={listing.scamRisk} size="sm" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-pretty truncate">
              {listing.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />
              {listing.neighborhood}, {listing.city}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-semibold tabular-nums">
              ${listing.price.toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground">/ month</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bed className="size-3.5" /> {listing.beds} bd
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="size-3.5" /> {listing.baths} ba
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize2 className="size-3.5" /> {listing.sqft} ft²
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 border-t border-border pt-3">
          <span className="font-medium text-foreground">Why this match: </span>
          {listing.reasoning}
        </p>
      </div>
    </Link>
  )
}
