"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, Check, ArrowRight, ArrowLeft, Mail, MessageCircle, Phone, Home, Building, Building2, BedDouble } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const STEPS = [
  { id: 1, label: "LOCATION",      sub: ["City & radius"] },
  { id: 2, label: "BUDGET",        sub: ["Monthly range"] },
  { id: 3, label: "PROPERTY TYPE", sub: ["Unit size"] },
  { id: 4, label: "NOTIFICATIONS", sub: ["Alert channels"] },
]

const UNIT_TYPES = [
  { id: "studio", label: "STUDIO",    description: "Open-plan living",   Icon: Home },
  { id: "1bed",   label: "1 BEDROOM", description: "One separate room",  Icon: BedDouble },
  { id: "2bed",   label: "2 BEDROOM", description: "Two separate rooms", Icon: Building },
  { id: "3bed",   label: "3+ BED",    description: "Three or more",      Icon: Building2 },
]

const NOTIFY_OPTIONS = [
  { id: "email",     label: "EMAIL",     description: "Alerts in your inbox",  Icon: Mail },
  { id: "whatsapp",  label: "WHATSAPP",  description: "Instant messages",      Icon: MessageCircle },
  { id: "sms",       label: "SMS",       description: "Text message alerts",   Icon: Phone },
]

const RADIUS_OPTIONS = ["5", "10", "15", "20", "30", "50"]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")

  // Step 1
  const [city, setCity]     = useState("")
  const [radius, setRadius] = useState("10")

  // Step 2
  const [budget, setBudget] = useState([2000, 15000])

  // Step 3
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])

  // Step 4
  const [selectedNotify, setSelectedNotify] = useState<string[]>(["email"])

  const toggleUnit = (id: string) =>
    setSelectedUnits(p => p.includes(id) ? p.filter(u => u !== id) : [...p, id])

  const toggleNotify = (id: string) =>
    setSelectedNotify(p => p.includes(id) ? p.filter(n => n !== id) : [...p, id])

  const validate = () => {
    setError("")
    if (step === 1 && !city.trim()) { setError("Please enter a city or area"); return false }
    if (step === 3 && selectedUnits.length === 0) { setError("Select at least one property type"); return false }
    return true
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const back = () => { setError(""); setStep(s => s - 1) }

  const handleComplete = async () => {
    if (!validate()) return
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("rs_token")
      if (!token) { router.push("/auth"); return }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
      const res = await fetch(`${apiUrl}/api/users/profile/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          min_budget:           budget[0],
          max_budget:           budget[1],
          location_city:        city,
          search_radius_km:     parseInt(radius),
          unit_types:           selectedUnits,
          notification_email:   selectedNotify.includes("email"),
          notification_whatsapp:selectedNotify.includes("whatsapp"),
          notification_sms:     selectedNotify.includes("sms"),
          notification_push:    true,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed to save") }
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-orange-500 to-orange-600 text-white px-8 py-10 flex-shrink-0">
        {/* Logo */}
        <div style={{ width: 44 }} className="mb-14">
          <Image
            src="/images/logo-orange.png"
            alt="Rent Scout"
            width={196}
            height={217}
            style={{ width: "100%", height: "auto", filter: "brightness(0) invert(1)" }}
            loading="eager"
          />
        </div>

        {/* Step list */}
        <nav className="flex flex-col gap-6">
          {STEPS.map((s) => {
            const done    = step > s.id
            const active  = step === s.id
            return (
              <div key={s.id} className="flex gap-3">
                {/* Circle / check */}
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2",
                    done   ? "bg-white border-white text-orange-500"
                    : active ? "bg-white/20 border-white text-white"
                    :          "bg-transparent border-white/40 text-white/40"
                  )}>
                    {done ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  {s.id < STEPS.length && (
                    <div className={cn("w-px flex-1 min-h-[28px]", done ? "bg-white/60" : "bg-white/20")} />
                  )}
                </div>

                {/* Label */}
                <div className="pb-6">
                  <p className={cn(
                    "text-xs font-bold tracking-widest",
                    active || done ? "text-white" : "text-white/40"
                  )}>
                    {s.label}
                  </p>
                  {active && s.sub.map((sub) => (
                    <p key={sub} className="text-xs text-white/70 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />{sub}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="mt-auto text-xs text-white/50">
          Rent Scout — AI Rental Discovery
        </div>
      </aside>

      {/* ── Right content ── */}
      <main className="flex-1 bg-white dark:bg-slate-950 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-center px-10 py-6 border-b border-slate-100 dark:border-slate-800">
          {/* Mobile logo */}
          <div className="md:hidden" style={{ width: 32 }}>
            <Image
              src="/images/logo-orange.png"
              alt="Rent Scout"
              width={196}
              height={217}
              style={{ width: "100%", height: "auto" }}
              loading="eager"
            />
          </div>
          <div className="hidden md:block" />
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-400 hover:text-orange-500 transition-colors"
          >
            Having troubles? <span className="text-orange-500 font-medium">Skip setup</span>
          </button>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center px-10 md:px-16 py-12 max-w-xl">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Step 1: Location ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Where are you looking?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Enter the city or area you want to find rentals in.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    City or suburb
                  </label>
                  <Input
                    placeholder="e.g. Cape Town, Johannesburg, Durban…"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Search radius
                  </label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r} km from city centre</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Budget ── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">What's your monthly budget?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Drag the slider to set your minimum and maximum rent.
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 mb-6 text-center">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  R{budget[0].toLocaleString()}
                  <span className="text-xl text-slate-400 mx-3">—</span>
                  R{budget[1].toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">per month</p>
              </div>

              <Slider
                value={budget}
                onValueChange={(v) => setBudget([v[0], v[1]])}
                min={0}
                max={50000}
                step={500}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>R0</span><span>R50,000</span>
              </div>
            </div>
          )}

          {/* ── Step 3: Property type ── */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">What size place do you need?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Select all the unit types you'd consider.
              </p>

              <div className="space-y-3">
                {UNIT_TYPES.map(({ id, label, description, Icon }) => {
                  const selected = selectedUnits.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => toggleUnit(id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                        selected
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        selected ? "bg-orange-500" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-slate-400")} />
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "font-bold text-xs tracking-widest",
                          selected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"
                        )}>{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                      </div>
                      {selected && <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: Notifications ── */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">How should we alert you?</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Choose how you want to receive new listing alerts.
              </p>

              <div className="space-y-3">
                {NOTIFY_OPTIONS.map(({ id, label, description, Icon }) => {
                  const selected = selectedNotify.includes(id)
                  return (
                    <button
                      key={id}
                      onClick={() => toggleNotify(id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
                        selected
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        selected ? "bg-orange-500" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-slate-400")} />
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "font-bold text-xs tracking-widest",
                          selected ? "text-orange-600 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"
                        )}>{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                      </div>
                      {selected && <ArrowRight className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav — mirrors the video's PREVIOUS STEP / NEXT → */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-10 md:px-16 py-5 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={back}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              PREVIOUS STEP
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length ? (
            <Button
              onClick={next}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide px-6"
            >
              NEXT <ArrowRight className="ml-1.5 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide px-6"
            >
              {loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : <>FINISH <Check className="ml-1.5 w-4 h-4" /></>
              }
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}
