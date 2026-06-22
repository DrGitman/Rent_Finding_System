"use client"

import { AppShell } from "@/components/app-shell"
import { useEffect, useState, useCallback } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  MapPin,
  Crosshair,
  Mail,
  MessageCircle,
  Smartphone,
  Loader2,
  X,
  RefreshCw,
  CheckCircle2,
  Facebook,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { users as usersApi, integrations as integrationsApi } from "@/lib/api"
import { toast } from "sonner"

const WHATSAPP_SERVICE = process.env.NEXT_PUBLIC_WHATSAPP_URL ?? "http://localhost:3001"

type WhatsAppStatus = "disconnected" | "connecting" | "connected" | "error"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Account
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")

  // Search prefs
  const [budget, setBudget] = useState<[number, number]>([500, 3000])
  const [location, setLocation] = useState("")
  const [radius, setRadius] = useState(5)

  // Notifications
  const [emailNotif, setEmailNotif] = useState(true)
  const [whatsapp, setWhatsapp] = useState(false)
  const [push, setPush] = useState(false)

  // WhatsApp connection state
  const [waStatus, setWaStatus] = useState<WhatsAppStatus>("disconnected")
  const [waQr, setWaQr] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)

  // Facebook connection state
  const [fbConnected, setFbConnected] = useState(false)
  const [fbEmail, setFbEmail] = useState("")
  const [fbPassword, setFbPassword] = useState("")
  const [showFbPassword, setShowFbPassword] = useState(false)
  const [fbSaving, setFbSaving] = useState(false)
  const [showFbForm, setShowFbForm] = useState(false)
  const [fbConnectedEmail, setFbConnectedEmail] = useState<string | null>(null)

  // Check Facebook status on mount
  useEffect(() => {
    integrationsApi.facebookStatus().then((s) => {
      setFbConnected(s.connected)
      setFbConnectedEmail(s.email)
    }).catch(() => {})
  }, [])

  // Poll WhatsApp status
  const checkWaStatus = useCallback(async () => {
    try {
      const res = await fetch(`${WHATSAPP_SERVICE}/status`)
      if (!res.ok) { setWaStatus("error"); return }
      const data = await res.json()
      setWaStatus(data.ready ? "connected" : data.qr ? "connecting" : "disconnected")
    } catch {
      setWaStatus("error")
    }
  }, [])

  useEffect(() => {
    checkWaStatus()
  }, [checkWaStatus])

  useEffect(() => {
    Promise.all([
      usersApi.me().catch(() => null),
      usersApi.profile().catch(() => null),
    ]).then(([me, profile]: [any, any]) => {
      if (me) {
        setFullName(me.full_name ?? "")
        setEmail(me.email ?? "")
      }
      if (profile?.preferences) {
        const p = profile.preferences
        if (p.min_price != null || p.max_price != null) {
          setBudget([p.min_price ?? 500, p.max_price ?? 3000])
        }
        if (p.city) setLocation(p.city)
        if (p.radius) setRadius(p.radius)
        if (p.email_notifications != null) setEmailNotif(p.email_notifications)
        if (p.whatsapp_notifications != null) setWhatsapp(p.whatsapp_notifications)
        if (p.push_notifications != null) setPush(p.push_notifications)
      }
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateProfile({
        full_name: fullName,
        preferences: {
          min_price: budget[0],
          max_price: budget[1],
          city: location,
          radius,
          email_notifications: emailNotif,
          whatsapp_notifications: whatsapp,
          push_notifications: push,
        },
      })
      if (fullName) localStorage.setItem("rs_user_name", fullName)
      toast.success("Preferences saved")
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const openQrModal = async () => {
    setShowQrModal(true)
    setQrLoading(true)
    setWaQr(null)
    try {
      const res = await fetch(`${WHATSAPP_SERVICE}/qr`)
      if (!res.ok) throw new Error("QR not available")
      const data = await res.json()
      if (data.qr) {
        setWaQr(data.qr)
      } else if (data.ready) {
        setWaStatus("connected")
        setShowQrModal(false)
        toast.success("WhatsApp already connected!")
      } else {
        toast.error("QR code not ready yet — WhatsApp service may be starting up.")
        setShowQrModal(false)
      }
    } catch {
      toast.error("Could not reach WhatsApp service. Make sure it is running.")
      setShowQrModal(false)
    } finally {
      setQrLoading(false)
    }
  }

  const refreshQr = async () => {
    setQrLoading(true)
    setWaQr(null)
    try {
      const res = await fetch(`${WHATSAPP_SERVICE}/qr`)
      const data = await res.json()
      if (data.qr) setWaQr(data.qr)
      else if (data.ready) {
        setWaStatus("connected")
        setShowQrModal(false)
        toast.success("WhatsApp connected!")
      }
    } catch {
      toast.error("Could not refresh QR code")
    } finally {
      setQrLoading(false)
    }
  }

  // Poll while QR modal is open
  useEffect(() => {
    if (!showQrModal || waStatus === "connected") return
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${WHATSAPP_SERVICE}/status`)
        const data = await res.json()
        if (data.ready) {
          setWaStatus("connected")
          setShowQrModal(false)
          toast.success("WhatsApp connected! Rental groups will now be scanned.")
          clearInterval(id)
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(id)
  }, [showQrModal, waStatus])

  const saveFacebookCredentials = async () => {
    if (!fbEmail || !fbPassword) {
      toast.error("Please enter your Facebook email and password")
      return
    }
    setFbSaving(true)
    try {
      await integrationsApi.saveFacebookCredentials(fbEmail, fbPassword)
      setFbConnected(true)
      setFbConnectedEmail(fbEmail)
      setShowFbForm(false)
      setFbPassword("")
      toast.success("Facebook credentials saved", {
        description: "Rent Scout will use these to search Marketplace listings.",
      })
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save credentials")
    } finally {
      setFbSaving(false)
    }
  }

  const disconnectFacebook = async () => {
    try {
      await integrationsApi.removeFacebookCredentials()
      setFbConnected(false)
      setFbConnectedEmail(null)
      setFbEmail("")
      setShowFbForm(false)
      toast.success("Facebook disconnected")
    } catch {
      toast.error("Failed to remove credentials")
    }
  }

  if (loading) {
    return (
      <AppShell title="Settings">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Settings">
      {/* WhatsApp QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>
            <div className="p-6 text-center space-y-4">
              <div className="size-10 rounded-full bg-green-500/10 text-green-500 grid place-items-center mx-auto">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Connect WhatsApp</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Open WhatsApp on your phone → Linked Devices → Link a Device, then scan this QR code.
                </p>
              </div>

              <div className="flex items-center justify-center min-h-[220px]">
                {qrLoading ? (
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                ) : waQr ? (
                  <img
                    src={waQr}
                    alt="WhatsApp QR code"
                    className="w-52 h-52 rounded-lg border border-border"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">QR code unavailable</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={refreshQr}
                  disabled={qrLoading}
                >
                  <RefreshCw className="size-3.5" />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowQrModal(false)}
                >
                  Done
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                After scanning, Rent Scout will monitor your rental WhatsApp groups automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-balance">
          Preferences
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell your agents what you&apos;re looking for. They&apos;ll handle the rest.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          <SectionLink active>Search preferences</SectionLink>
          <SectionLink>Notifications</SectionLink>
          <SectionLink>Integrations</SectionLink>
          <SectionLink>Account</SectionLink>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          {/* Search prefs */}
          <Card title="Search preferences" description="Used by agents to filter and rank listings.">
            <Field
              icon={DollarSign}
              label="Monthly budget"
              hint={`N$${budget[0].toLocaleString()} — N$${budget[1].toLocaleString()}`}
            >
              <Slider
                min={300}
                max={25000}
                step={100}
                value={budget}
                onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])}
                className="mt-2"
              />
            </Field>

            <Field icon={MapPin} label="Location" hint="City or area">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Windhoek, Namibia"
                className="rounded-md mt-1.5"
              />
            </Field>

            <Field icon={Crosshair} label="Search radius" hint={`${radius} km`}>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[radius]}
                onValueChange={(v) => setRadius(v[0])}
                className="mt-2"
              />
            </Field>
          </Card>

          {/* Notifications */}
          <Card title="Notifications" description="Where to deliver alerts and matches.">
            <ToggleRow
              icon={Mail}
              label="Email"
              description="Daily digest and critical alerts."
              checked={emailNotif}
              onChange={setEmailNotif}
            />
            <ToggleRow
              icon={MessageCircle}
              label="WhatsApp"
              description="Real-time matches via your connected WhatsApp."
              checked={whatsapp}
              onChange={setWhatsapp}
            />
            <ToggleRow
              icon={Smartphone}
              label="Push"
              description="Browser push for high-priority alerts."
              checked={push}
              onChange={setPush}
            />
          </Card>

          {/* Integrations */}
          <Card title="Integrations" description="Connect sources so agents can search them.">
            {/* WhatsApp */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className={`size-8 rounded-md grid place-items-center shrink-0 mt-0.5 ${
                  waStatus === "connected"
                    ? "bg-green-500/10 text-green-500"
                    : waStatus === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                }`}>
                  <MessageCircle className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2">
                    WhatsApp Groups
                    {waStatus === "connected" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                        <span className="size-1.5 rounded-full bg-green-500" />
                        Connected
                      </span>
                    )}
                    {waStatus === "error" && (
                      <span className="text-[10px] text-destructive">Service offline</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scan your rental WhatsApp groups for new listings.
                  </p>
                </div>
              </div>
              {waStatus === "connected" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2 text-green-600 border-green-200 dark:border-green-800"
                  onClick={checkWaStatus}
                >
                  <CheckCircle2 className="size-3.5" />
                  Connected
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={openQrModal}
                  disabled={waStatus === "error"}
                >
                  {waStatus === "error" ? (
                    <><WifiOff className="size-3.5" /> Offline</>
                  ) : (
                    <><Wifi className="size-3.5" /> Connect</>
                  )}
                </Button>
              )}
            </div>

            <div className="border-t border-border" />

            {/* Facebook */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`size-8 rounded-md grid place-items-center shrink-0 mt-0.5 ${
                    fbConnected
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Facebook className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      Facebook Marketplace
                      {fbConnected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                          <span className="size-1.5 rounded-full bg-blue-500" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {fbConnected && fbConnectedEmail
                        ? `Logged in as ${fbConnectedEmail}`
                        : "Enter your Facebook login so agents can browse Marketplace listings."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {fbConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={disconnectFacebook}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowFbForm((v) => !v)}
                  >
                    {fbConnected ? "Update" : <><Facebook className="size-3.5" />Connect</>}
                  </Button>
                </div>
              </div>

              {/* Inline credential form */}
              {showFbForm && (
                <div className="ml-11 space-y-3 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    Your credentials are stored locally on the server and only used to browse Marketplace.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="fb-email" className="text-xs">Facebook Email</Label>
                    <Input
                      id="fb-email"
                      type="email"
                      placeholder="you@example.com"
                      value={fbEmail}
                      onChange={(e) => setFbEmail(e.target.value)}
                      className="rounded-md h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-password" className="text-xs">Facebook Password</Label>
                    <div className="relative">
                      <Input
                        id="fb-password"
                        type={showFbPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={fbPassword}
                        onChange={(e) => setFbPassword(e.target.value)}
                        className="rounded-md h-8 text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowFbPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showFbPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={saveFacebookCredentials}
                      disabled={fbSaving || !fbEmail || !fbPassword}
                    >
                      {fbSaving && <Loader2 className="size-3.5 animate-spin" />}
                      Save credentials
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setShowFbForm(false); setFbPassword("") }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Account */}
          <Card title="Account" description="Your basic profile information.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="acc-email" className="text-xs">Email</Label>
                <Input
                  id="acc-email"
                  type="email"
                  value={email}
                  disabled
                  className="mt-1.5 rounded-md opacity-60"
                />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
              Discard
            </Button>
            <Button className="rounded-full gap-2" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function SectionLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <a href="#" className={`block text-sm rounded-md px-3 py-2 transition-colors ${
      active ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
    }`}>
      {children}
    </a>
  )
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  )
}

function Field({ icon: Icon, label, hint, children }: {
  icon: React.ComponentType<{ className?: string }>; label: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </span>
        {hint && <span className="text-[11px] font-mono text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({ icon: Icon, label, description, checked, onChange }: {
  icon: React.ComponentType<{ className?: string }>; label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="size-8 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0 mt-0.5">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1" />
    </div>
  )
}
