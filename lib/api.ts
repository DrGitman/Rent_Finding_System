/**
 * Rent Scout — Backend API Client
 * All requests go to the FastAPI backend at /api/*
 * Auth token is stored in localStorage under "rs_token".
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ─── helpers ────────────────────────────────────────────────────────────────

function token(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("rs_token")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  const tok = token()
  if (tok) headers["Authorization"] = `Bearer ${tok}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail?.detail ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

const get  = <T>(path: string) => request<T>(path, { method: "GET" })
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) })
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) })
const del  = <T>(path: string) => request<T>(path, { method: "DELETE" })

// ─── auth ────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export const auth = {
  register: (email: string, password: string, full_name: string) =>
    post<AuthTokens>("/api/auth/register", { email, password, full_name }),

  login: (email: string, password: string) =>
    post<AuthTokens>("/api/auth/login", { email, password }),

  refresh: (refresh_token: string) =>
    post<AuthTokens>("/api/auth/refresh", { refresh_token }),

  saveToken: (tokens: AuthTokens) => {
    localStorage.setItem("rs_token", tokens.access_token)
    localStorage.setItem("rs_refresh_token", tokens.refresh_token)
  },

  clearToken: () => {
    localStorage.removeItem("rs_token")
    localStorage.removeItem("rs_refresh_token")
  },

  isLoggedIn: () => !!token(),
}

// ─── users ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
  status: string
  created_at: string
}

export const users = {
  me: () => get<UserProfile>("/api/users/me"),
  profile: () => get<unknown>("/api/users/profile"),
  updateProfile: (data: Record<string, unknown>) => put<unknown>("/api/users/profile", data),
  onboarding: (prefs: Record<string, unknown>) => post<unknown>("/api/users/onboarding", prefs),
}

// ─── listings ────────────────────────────────────────────────────────────────

export interface BackendListing {
  id: number
  listing_id: string
  title: string | null
  price: number | null
  source: string | null
  url: string | null
  image_url: string | null
  ai_score: number | null
  scam_risk: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ListingsParams {
  source?: string
  min_price?: number
  max_price?: number
  min_ai_score?: number
  max_scam_risk?: number
  limit?: number
  offset?: number
}

export const listings = {
  list: (params: ListingsParams = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    })
    const query = qs.toString() ? `?${qs}` : ""
    return get<BackendListing[]>(`/api/listings${query}`)
  },
  get: (id: number) => get<BackendListing>(`/api/listings/${id}`),
  stats: () => get<unknown>("/api/listings/stats"),
  evaluate: (id: number, data: Record<string, unknown>) =>
    post<unknown>(`/api/listings/${id}/evaluate`, data),
  scamCheck: (id: number, data: Record<string, unknown>) =>
    post<unknown>(`/api/listings/${id}/scam-check`, data),
  delete: (id: number) => del<unknown>(`/api/listings/${id}`),
}

// ─── agents ──────────────────────────────────────────────────────────────────

export interface Agent {
  id: number
  name: string
  description: string | null
  agent_type: string | null
  source: string | null
  status: string
  n8n_workflow_id: string | null
  last_run: string | null
  next_run: string | null
  created_at: string
}

export const agents = {
  list: () => get<Agent[]>("/api/agents"),
  get: (id: number) => get<Agent>(`/api/agents/${id}`),
  create: (data: Record<string, unknown>) => post<Agent>("/api/agents", data),
  update: (id: number, data: Record<string, unknown>) => put<Agent>(`/api/agents/${id}`, data),
  delete: (id: number) => del<unknown>(`/api/agents/${id}`),
  run: (id: number) => post<unknown>(`/api/agents/${id}/run-now`, {}),
  pause: (id: number) => post<unknown>(`/api/agents/${id}/pause`, {}),
  activities: (id: number) => get<unknown[]>(`/api/agents/${id}/activities`),
}

// ─── notifications ───────────────────────────────────────────────────────────

export interface BackendNotification {
  id: number
  notification_type: string | null
  title: string | null
  description: string | null
  related_listing_id: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

export const notifications = {
  list: (params: { notification_type?: string; is_read?: boolean; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v))
    })
    const query = qs.toString() ? `?${qs}` : ""
    return get<BackendNotification[]>(`/api/notifications/${query}`)
  },
  markRead: (id: number) => put<BackendNotification>(`/api/notifications/${id}/read`, {}),
  markUnread: (id: number) => put<BackendNotification>(`/api/notifications/${id}/unread`, {}),
  markAllRead: () => post<unknown>("/api/notifications/mark-all-read", {}),
  delete: (id: number) => del<unknown>(`/api/notifications/${id}`),
  deleteAllRead: () => post<unknown>("/api/notifications/delete-all-read", {}),
  unreadCount: () => get<{ unread_count: number }>("/api/notifications/unread-count"),
}

// ─── rules ───────────────────────────────────────────────────────────────────

export interface Rule {
  id: number
  name: string
  description: string | null
  status: string
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  created_at: string
}

export const rules = {
  list: () => get<Rule[]>("/api/rules"),
  get: (id: number) => get<Rule>(`/api/rules/${id}`),
  create: (data: Record<string, unknown>) => post<Rule>("/api/rules", data),
  update: (id: number, data: Record<string, unknown>) => put<Rule>(`/api/rules/${id}`, data),
  delete: (id: number) => del<unknown>(`/api/rules/${id}`),
  test: (id: number, listing: Record<string, unknown>) =>
    post<unknown>(`/api/rules/${id}/test`, listing),
  activity: (id: number) => get<unknown[]>(`/api/rules/${id}/activity`),
}

// ─── scrapers (on-demand) ────────────────────────────────────────────────────

export const scrapers = {
  zillow: (city: string, max_pages = 2) =>
    post<unknown>("/api/scrapers/zillow", { city, max_pages }),
  apartments: (city: string) =>
    post<unknown>("/api/scrapers/apartments", { city }),
  craigslist: (city: string) =>
    post<unknown>("/api/scrapers/craigslist", { city }),
  facebook: (city: string) =>
    post<unknown>("/api/scrapers/facebook", { city }),
  whatsapp: (keywords: string[]) =>
    post<unknown>("/api/scrapers/whatsapp-groups", { keywords }),
}

// ─── type mappers (backend → frontend) ──────────────────────────────────────

import type { Listing, ScamRisk } from "./data"

export function backendListingToFrontend(l: BackendListing): Listing {
  const scamNum = l.scam_risk ?? 0
  const scamRisk: ScamRisk =
    scamNum >= 70 ? "high" : scamNum >= 40 ? "medium" : "low"

  return {
    id: String(l.id),
    title: l.title ?? "Untitled listing",
    address: l.notes ?? "",
    neighborhood: "",
    city: "",
    price: Number(l.price ?? 0),
    beds: 0,
    baths: 0,
    sqft: 0,
    image: l.image_url ?? "/listings/apt-1.jpg",
    images: l.image_url ? [l.image_url] : ["/listings/apt-1.jpg"],
    source: (l.source as Listing["source"]) ?? "Zillow",
    aiScore: l.ai_score ?? 0,
    scamRisk,
    marketDelta: 0,
    reasoning: l.notes ?? "",
    highlights: [],
    scamSignals: scamNum >= 40 ? [`Scam risk: ${scamNum}%`] : [],
    foundAt: new Date(l.created_at).toLocaleString(),
    lat: 0,
    lng: 0,
  }
}
