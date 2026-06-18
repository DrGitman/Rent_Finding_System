"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Listing = {
  id: number;
  listing_id?: string;
  title?: string;
  price?: number;
  source?: string;
  url?: string;
  image_url?: string;
  ai_score?: number;
  scam_risk?: number;
  notes?: string;
  created_at?: string;
  user_id?: number;
};

type FilterState = {
  source: string;
  priceMin: number;
  priceMax: number;
  aiScoreMin: number;
  scamRiskMax: number;
  sortBy: string;
  page: number;
  limit: number;
};

const API_ROOT = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SOURCES = ["zillow", "apartments", "craigslist", "facebook", "whatsapp"];
const SORT_OPTIONS = [
  { value: "created_at", label: "Newest First" },
  { value: "-created_at", label: "Oldest First" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "ai_score", label: "AI Score: Low to High" },
  { value: "-ai_score", label: "AI Score: High to Low" },
  { value: "scam_risk", label: "Scam Risk: Low to High" },
  { value: "-scam_risk", label: "Scam Risk: High to Low" },
];

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    source: "",
    priceMin: 300,
    priceMax: 5000,
    aiScoreMin: 0,
    scamRiskMax: 100,
    sortBy: "-created_at",
    page: 1,
    limit: 10,
  });

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sort: filters.sortBy,
      });
      
      if (filters.source) params.append("source", filters.source);
      if (filters.priceMin > 0) params.append("price_min", filters.priceMin.toString());
      if (filters.priceMax < 10000) params.append("price_max", filters.priceMax.toString());
      if (filters.aiScoreMin > 0) params.append("ai_score_min", filters.aiScoreMin.toString());
      if (filters.scamRiskMax < 100) params.append("scam_risk_max", filters.scamRiskMax.toString());

      const token = typeof window !== "undefined" ? localStorage.getItem("rs_token") : null
      const res = await fetch(`${API_ROOT}/api/listings?${params.toString()}`, {
        headers: {
          "Accept": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setListings(data.listings || []);
      setTotalCount(data.total || 0);
    } catch (e: any) {
      setError(e.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleFilterChange = (key: keyof Omit<FilterState, "page" | "limit">, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: Math.max(1, newPage) }));
  };

  const getRiskColor = (risk: number | undefined) => {
    if (!risk) return "bg-gray-100 text-gray-800";
    if (risk < 30) return "bg-green-100 text-green-800";
    if (risk < 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score > 75) return "bg-green-100 text-green-800";
    if (score > 50) return "bg-blue-100 text-blue-800";
    if (score > 25) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rental Listings</h1>
          <p className="text-gray-600 mt-2">Found {totalCount} properties</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error: {error}</p>
            <Button onClick={() => fetchListings()} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <Select value={filters.source} onValueChange={(v) => handleFilterChange("source", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All sources</SelectItem>
                      {SOURCES.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price Range: ${filters.priceMin} - ${filters.priceMax}
                  </label>
                  <div className="space-y-2">
                    <Slider
                      value={[filters.priceMin]}
                      onValueChange={(v) => handleFilterChange("priceMin", v[0])}
                      min={0}
                      max={5000}
                      step={100}
                      className="w-full"
                    />
                    <Slider
                      value={[filters.priceMax]}
                      onValueChange={(v) => handleFilterChange("priceMax", v[0])}
                      min={300}
                      max={5000}
                      step={100}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* AI Score Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min AI Score: {filters.aiScoreMin}
                  </label>
                  <Slider
                    value={[filters.aiScoreMin]}
                    onValueChange={(v) => handleFilterChange("aiScoreMin", v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Scam Risk Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Scam Risk: {filters.scamRiskMax}
                  </label>
                  <Slider
                    value={[filters.scamRiskMax]}
                    onValueChange={(v) => handleFilterChange("scamRiskMax", v[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange("sortBy", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Limit Per Page */}
                <div>
                  <label className="block text-sm font-medium mb-2">Items per page</label>
                  <Select value={filters.limit.toString()} onValueChange={(v) => setFilters(prev => ({ ...prev, limit: parseInt(v), page: 1 }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => fetchListings()} className="w-full">
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {listings.length === 0 ? (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-medium text-gray-900">No listings found</p>
                  <p className="text-gray-600 mt-1">Try adjusting your filters</p>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 mb-6">
                  {listings.map(listing => (
                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-48 h-48 bg-gray-200 flex-shrink-0 flex items-center justify-center">
                          {listing.image_url ? (
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-gray-400">No image</div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{listing.title || "Untitled"}</h3>
                              <p className="text-sm text-gray-500">{listing.source?.toUpperCase()}</p>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">${listing.price?.toLocaleString() || "N/A"}</p>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className={getScoreColor(listing.ai_score)}>
                              AI Score: {listing.ai_score ?? "N/A"}
                            </Badge>
                            <Badge className={getRiskColor(listing.scam_risk)}>
                              Scam Risk: {listing.scam_risk ?? "N/A"}%
                            </Badge>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowDetail(true);
                              }}
                            >
                              View Details
                            </Button>
                            {listing.url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(listing.url, "_blank")}
                              >
                                View Original
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {filters.page} of {totalPages} ({totalCount} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Sheet */}
        <Sheet open={showDetail} onOpenChange={setShowDetail}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {selectedListing && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedListing.title}</SheetTitle>
                  <SheetDescription className="text-sm">{selectedListing.source?.toUpperCase()}</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {selectedListing.image_url && (
                    <img src={selectedListing.image_url} alt={selectedListing.title} className="w-full rounded-lg" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-2xl font-bold">${selectedListing.price?.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">AI Score</p>
                      <p className={`text-lg font-semibold ${getScoreColor(selectedListing.ai_score)}`}>
                        {selectedListing.ai_score ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Scam Risk</p>
                      <p className={`text-lg font-semibold ${getRiskColor(selectedListing.scam_risk)}`}>
                        {selectedListing.scam_risk ?? "N/A"}%
                      </p>
                    </div>
                  </div>
                  {selectedListing.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedListing.notes}</p>
                    </div>
                  )}
                  {selectedListing.url && (
                    <Button
                      className="w-full"
                      onClick={() => window.open(selectedListing.url, "_blank")}
                    >
                      View Original Listing
                    </Button>
                  )}
                  {selectedListing.created_at && (
                    <p className="text-xs text-gray-500">
                      Added: {new Date(selectedListing.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  if (!listings.length)
    return <div className="p-6">No saved listings yet. Check your agents or scanner.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Saved Listings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l) => (
          <div key={l.id} className="border rounded p-4 shadow-sm">
            <div className="flex items-start gap-4">
              {l.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image_url} alt={l.title} className="w-24 h-24 object-cover rounded" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">No image</div>
              )}
              <div className="flex-1">
                <h2 className="font-medium">{l.title || "Untitled"}</h2>
                <div className="text-sm text-gray-600">Source: {l.source || "—"}</div>
                <div className="mt-2">
                  <span className="font-semibold">${l.price ?? "—"}</span>
                  <span className="ml-3 text-sm text-gray-600">AI {l.ai_score ?? "—"}%</span>
                  <span className="ml-3 text-sm text-gray-600">Scam {l.scam_risk ?? "—"}%</span>
                </div>
                <div className="mt-2 text-sm text-gray-700">{l.notes && l.notes.slice(0, 120)}</div>
                <div className="mt-3">
                  {l.url && (
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                      View original
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
