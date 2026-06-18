export type ScamRisk = "low" | "medium" | "high"

export type Listing = {
  id: string
  title: string
  address: string
  neighborhood: string
  city: string
  price: number
  beds: number
  baths: number
  sqft: number
  image: string
  images: string[]
  source: "Facebook Marketplace" | "Zillow" | "Craigslist" | "WhatsApp Group" | "Telegram" | "Trulia"
  aiScore: number // 0-100
  scamRisk: ScamRisk
  marketDelta: number // negative = below market, positive = above
  reasoning: string
  highlights: string[]
  scamSignals: string[]
  foundAt: string
  lat: number
  lng: number
}

export const listings: Listing[] = [
  {
    id: "lst-001",
    title: "Sunlit 2BR with home office",
    address: "412 Linden Ave, Apt 3B",
    neighborhood: "Williamsburg",
    city: "Brooklyn, NY",
    price: 2850,
    beds: 2,
    baths: 1,
    sqft: 920,
    image: "/listings/apt-1.jpg",
    images: ["/listings/apt-1.jpg", "/listings/apt-5.jpg", "/listings/apt-3.jpg", "/listings/apt-8.jpg"],
    source: "Facebook Marketplace",
    aiScore: 94,
    scamRisk: "low",
    marketDelta: -8.2,
    reasoning:
      "Priced 8% below comparable units in Williamsburg. Listed by verified poster with a 3-year history. Photos appear original and consistent across listings.",
    highlights: ["8% below market", "Verified landlord", "Original photos", "Recently renovated"],
    scamSignals: [],
    foundAt: "2 minutes ago",
    lat: 40.7081,
    lng: -73.9571,
  },
  {
    id: "lst-002",
    title: "Bright Scandinavian studio",
    address: "88 Greenpoint Ave",
    neighborhood: "Greenpoint",
    city: "Brooklyn, NY",
    price: 2150,
    beds: 1,
    baths: 1,
    sqft: 540,
    image: "/listings/apt-2.jpg",
    images: ["/listings/apt-2.jpg", "/listings/apt-4.jpg", "/listings/apt-7.jpg"],
    source: "Zillow",
    aiScore: 89,
    scamRisk: "low",
    marketDelta: -3.1,
    reasoning:
      "Slightly below median for Greenpoint studios. Listing agent verified through multiple sources. Photos cross-checked — no duplicates detected.",
    highlights: ["Below market", "Verified agent", "Quick response history"],
    scamSignals: [],
    foundAt: "11 minutes ago",
    lat: 40.7301,
    lng: -73.9544,
  },
  {
    id: "lst-003",
    title: "Cozy 1BR near transit",
    address: "1207 Bedford Ave",
    neighborhood: "Bed-Stuy",
    city: "Brooklyn, NY",
    price: 1950,
    beds: 1,
    baths: 1,
    sqft: 620,
    image: "/listings/apt-3.jpg",
    images: ["/listings/apt-3.jpg", "/listings/apt-6.jpg"],
    source: "Craigslist",
    aiScore: 76,
    scamRisk: "medium",
    marketDelta: -14.5,
    reasoning:
      "Price is unusually low for the area. Some photos appear in 2 other unrelated listings. Recommend verifying landlord before transferring any funds.",
    highlights: ["Walkable area", "Near A/C trains"],
    scamSignals: ["Photos found in other listings", "Price 14% below comparable units", "Owner unreachable by phone"],
    foundAt: "23 minutes ago",
    lat: 40.6892,
    lng: -73.9522,
  },
  {
    id: "lst-004",
    title: "Modern 3BR with kitchen island",
    address: "55 N 6th St",
    neighborhood: "Williamsburg",
    city: "Brooklyn, NY",
    price: 4200,
    beds: 3,
    baths: 2,
    sqft: 1340,
    image: "/listings/apt-4.jpg",
    images: ["/listings/apt-4.jpg", "/listings/apt-1.jpg", "/listings/apt-5.jpg", "/listings/apt-6.jpg"],
    source: "Trulia",
    aiScore: 91,
    scamRisk: "low",
    marketDelta: 2.4,
    reasoning:
      "At market rate for the unit type. Building has good reviews. Agent has 47 successful listings on record. Strong candidate for families.",
    highlights: ["Family-friendly", "In-unit laundry", "Reputable building"],
    scamSignals: [],
    foundAt: "34 minutes ago",
    lat: 40.7178,
    lng: -73.9622,
  },
  {
    id: "lst-005",
    title: "Loft with exposed brick",
    address: "320 Wythe Ave",
    neighborhood: "Williamsburg",
    city: "Brooklyn, NY",
    price: 3450,
    beds: 2,
    baths: 1,
    sqft: 1050,
    image: "/listings/apt-5.jpg",
    images: ["/listings/apt-5.jpg", "/listings/apt-2.jpg", "/listings/apt-8.jpg"],
    source: "WhatsApp Group",
    aiScore: 82,
    scamRisk: "low",
    marketDelta: -5.6,
    reasoning:
      "Discovered in a curated rental WhatsApp group. Poster has shared 12 verified listings previously. Photos are original and high-quality.",
    highlights: ["High ceilings", "Original loft", "Trusted source"],
    scamSignals: [],
    foundAt: "1 hour ago",
    lat: 40.7195,
    lng: -73.9591,
  },
  {
    id: "lst-006",
    title: "Charming dining-focused 2BR",
    address: "94 India St",
    neighborhood: "Greenpoint",
    city: "Brooklyn, NY",
    price: 2950,
    beds: 2,
    baths: 1,
    sqft: 880,
    image: "/listings/apt-6.jpg",
    images: ["/listings/apt-6.jpg", "/listings/apt-4.jpg", "/listings/apt-7.jpg"],
    source: "Zillow",
    aiScore: 87,
    scamRisk: "low",
    marketDelta: -1.8,
    reasoning:
      "Solid match for a couple or roommates. Slightly below market. Verified agent. No signals of duplicate or fake content.",
    highlights: ["Open dining area", "Verified agent"],
    scamSignals: [],
    foundAt: "2 hours ago",
    lat: 40.7339,
    lng: -73.9546,
  },
  {
    id: "lst-007",
    title: "Renovated 1BR — too good to be true?",
    address: "999 Manhattan Ave",
    neighborhood: "Greenpoint",
    city: "Brooklyn, NY",
    price: 1100,
    beds: 1,
    baths: 1,
    sqft: 700,
    image: "/listings/apt-7.jpg",
    images: ["/listings/apt-7.jpg"],
    source: "Facebook Marketplace",
    aiScore: 22,
    scamRisk: "high",
    marketDelta: -54.2,
    reasoning:
      "Price is dramatically below market. Poster account is 4 days old with no other activity. Photos reverse-image-match a Toronto listing from 2022. Likely scam.",
    highlights: [],
    scamSignals: [
      "New account (4 days old)",
      "Photos match unrelated Toronto listing",
      "Price 54% below market",
      "Asks for wire transfer before viewing",
    ],
    foundAt: "3 hours ago",
    lat: 40.7352,
    lng: -73.9542,
  },
  {
    id: "lst-008",
    title: "Quiet 2BR with home office nook",
    address: "210 Manhattan Ave",
    neighborhood: "East Williamsburg",
    city: "Brooklyn, NY",
    price: 2650,
    beds: 2,
    baths: 1,
    sqft: 850,
    image: "/listings/apt-8.jpg",
    images: ["/listings/apt-8.jpg", "/listings/apt-1.jpg", "/listings/apt-3.jpg"],
    source: "Telegram",
    aiScore: 85,
    scamRisk: "low",
    marketDelta: -4.3,
    reasoning:
      "Posted in a curated Telegram channel of vetted local landlords. Solid value for the area. Original photos.",
    highlights: ["Work-from-home friendly", "Trusted channel"],
    scamSignals: [],
    foundAt: "5 hours ago",
    lat: 40.7148,
    lng: -73.9425,
  },
]

export type Alert = {
  id: string
  type: "deal" | "scam" | "match" | "system"
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  timestamp: string
  listingId?: string
}

export const alerts: Alert[] = [
  {
    id: "alr-001",
    type: "deal",
    severity: "info",
    title: "High-value match detected",
    description:
      "Sunlit 2BR with home office in Williamsburg priced 8% below market. Score 94. Verified source.",
    timestamp: "2 min ago",
    listingId: "lst-001",
  },
  {
    id: "alr-002",
    type: "scam",
    severity: "critical",
    title: "Likely scam flagged",
    description:
      "Renovated 1BR on Manhattan Ave — photos reused from a 2022 Toronto listing. Wire-transfer request before viewing.",
    timestamp: "3 hr ago",
    listingId: "lst-007",
  },
  {
    id: "alr-003",
    type: "match",
    severity: "info",
    title: "New listing matches your filters",
    description: "Bright Scandinavian studio in Greenpoint just appeared. AI score 89.",
    timestamp: "11 min ago",
    listingId: "lst-002",
  },
  {
    id: "alr-004",
    type: "scam",
    severity: "warning",
    title: "Suspicious pricing",
    description: "Cozy 1BR near transit priced 14% below comparable units. Verify before deposit.",
    timestamp: "23 min ago",
    listingId: "lst-003",
  },
  {
    id: "alr-005",
    type: "system",
    severity: "info",
    title: "Search radius expanded",
    description: "Auto-expanded radius by 1 km after 4 hours with no new high-score matches.",
    timestamp: "6 hr ago",
  },
  {
    id: "alr-006",
    type: "deal",
    severity: "info",
    title: "New trusted-source listing",
    description: "Loft with exposed brick on Wythe Ave shared by a verified WhatsApp poster.",
    timestamp: "1 hr ago",
    listingId: "lst-005",
  },
]

export type Activity = {
  id: string
  kind: "scan" | "evaluate" | "scam" | "match" | "system"
  message: string
  detail?: string
  timestamp: string
}

export const activities: Activity[] = [
  { id: "act-001", kind: "scan", message: "Scanning Facebook Marketplace", detail: "Brooklyn — 5km radius", timestamp: "just now" },
  { id: "act-002", kind: "evaluate", message: "Evaluating 247 new listings", detail: "Cross-checking photos and price", timestamp: "1 min ago" },
  { id: "act-003", kind: "match", message: "High-quality rental match found", detail: "Sunlit 2BR in Williamsburg • Score 94", timestamp: "2 min ago" },
  { id: "act-004", kind: "scan", message: "Scanning Zillow", detail: "Greenpoint — 3km radius", timestamp: "8 min ago" },
  { id: "act-005", kind: "match", message: "New listing matches preferences", detail: "Bright studio in Greenpoint • Score 89", timestamp: "11 min ago" },
  { id: "act-006", kind: "scam", message: "Flagged potential scam", detail: "Photos reused from unrelated listing", timestamp: "23 min ago" },
  { id: "act-007", kind: "scan", message: "Scanning curated WhatsApp groups", detail: "12 trusted sources", timestamp: "34 min ago" },
  { id: "act-008", kind: "evaluate", message: "Re-ranking results", detail: "Adjusted weights after preference change", timestamp: "1 hr ago" },
  { id: "act-009", kind: "scan", message: "Scanning Craigslist", detail: "Filtering duplicates", timestamp: "1 hr ago" },
  { id: "act-010", kind: "system", message: "Search radius auto-expanded to 6km", detail: "No new top matches in last 4h", timestamp: "6 hr ago" },
  { id: "act-011", kind: "scam", message: "Blocked deceptive listing", detail: "Account age 4 days — wire-transfer request", timestamp: "3 hr ago" },
  { id: "act-012", kind: "evaluate", message: "Compared prices to local market", detail: "Updated medians for 6 neighborhoods", timestamp: "4 hr ago" },
]

export type Notification = {
  id: string
  category: "deals" | "scams" | "system"
  title: string
  description: string
  timestamp: string
  read: boolean
}

export const notifications: Notification[] = [
  { id: "n-001", category: "deals", title: "New top-rated match", description: "Sunlit 2BR in Williamsburg • Score 94", timestamp: "2m", read: false },
  { id: "n-002", category: "scams", title: "Scam blocked", description: "Renovated 1BR with reused photos", timestamp: "3h", read: false },
  { id: "n-003", category: "deals", title: "Price drop on saved listing", description: "Loft with exposed brick — now $3,450", timestamp: "5h", read: false },
  { id: "n-004", category: "system", title: "Daily digest ready", description: "12 new evaluated matches in your area", timestamp: "9h", read: true },
  { id: "n-005", category: "deals", title: "New trusted-source listing", description: "Modern 3BR via verified Telegram channel", timestamp: "1d", read: true },
  { id: "n-006", category: "system", title: "Search radius expanded", description: "Auto-expanded to 6km after low match volume", timestamp: "1d", read: true },
  { id: "n-007", category: "scams", title: "Suspicious pricing flagged", description: "1BR priced 14% below comparable units", timestamp: "2d", read: true },
]
