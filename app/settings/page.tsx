"use client"

import { AppShell } from "@/components/app-shell"
import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DollarSign, MapPin, Crosshair, Mail, MessageCircle, Smartphone } from "lucide-react"

export default function SettingsPage() {
  const [budget, setBudget] = useState<[number, number]>([1800, 3200])
  const [radius, setRadius] = useState<number>(5)
  const [email, setEmail] = useState(true)
  const [whatsapp, setWhatsapp] = useState(true)
  const [push, setPush] = useState(false)

  return (
    <AppShell title="Settings">
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
          <SectionLink>Account</SectionLink>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          {/* Search prefs */}
          <Card title="Search preferences" description="Used by agents to filter and rank.">
            <Field
              icon={DollarSign}
              label="Monthly budget"
              hint={`$${budget[0].toLocaleString()} — $${budget[1].toLocaleString()}`}
            >
              <Slider
                min={500}
                max={6000}
                step={50}
                value={budget}
                onValueChange={(v) => setBudget([v[0], v[1]] as [number, number])}
                className="mt-2"
              />
            </Field>

            <Field icon={MapPin} label="Location" hint="City or neighborhood">
              <Input defaultValue="Brooklyn, NY" className="rounded-md" />
            </Field>

            <Field
              icon={Crosshair}
              label="Search radius"
              hint={`${radius} km`}
            >
              <Slider
                min={1}
                max={25}
                step={1}
                value={[radius]}
                onValueChange={(v) => setRadius(v[0])}
                className="mt-2"
              />
            </Field>
          </Card>

          {/* Notifications */}
          <Card
            title="Notifications"
            description="Where to deliver alerts and matches."
          >
            <ToggleRow
              icon={Mail}
              label="Email"
              description="Daily digest and critical alerts."
              checked={email}
              onChange={setEmail}
            />
            <ToggleRow
              icon={MessageCircle}
              label="WhatsApp"
              description="Real-time matches via your verified number."
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

          {/* Account */}
          <Card title="Account" description="Your basic profile.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input id="name" defaultValue="Tawhid Mahmood" className="mt-1.5 rounded-md" />
              </div>
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" defaultValue="tawhid@example.com" className="mt-1.5 rounded-md" />
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-full">Discard</Button>
            <Button className="rounded-full">Save changes</Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function SectionLink({
  children,
  active,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <a
      href="#"
      className={`block text-sm rounded-md px-3 py-2 transition-colors ${
        active
          ? "bg-muted text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </a>
  )
}

function Card({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  )
}

function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <Icon className="size-3.5 text-muted-foreground" />
          {label}
        </span>
        {hint && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="size-8 rounded-md bg-muted text-muted-foreground grid place-items-center shrink-0 mt-0.5">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-1" />
    </div>
  )
}
