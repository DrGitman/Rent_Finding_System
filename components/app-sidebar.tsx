"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Home,
  ListFilter,
  Map,
  Bell,
  Activity,
  Inbox,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/results", label: "Results", icon: ListFilter },
  { href: "/map", label: "Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: true },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    setUserName(localStorage.getItem("rs_user_name"))
    setUserEmail(localStorage.getItem("rs_user_email"))
  }, [])

  // Pick logo based on current theme
  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/images/logo-white.png"
      : "/images/logo-black.png"

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : "RS"

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        {mounted ? (
          <Image
            src={logoSrc}
            alt="Rent Scout"
            width={130}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        ) : (
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        )}
      </div>

      {/* Navigation */}
      <nav className="px-3 mt-2 flex flex-col gap-0.5">
        {nav.map((item) => {
          const Icon = item.icon
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] font-medium rounded-full bg-primary text-primary-foreground px-1.5 py-0.5">
                  {alertCount > 0 ? alertCount : ""}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — user + agent status */}
      <div className="mt-auto p-4 space-y-3 border-t border-sidebar-border">
        {/* Agent status card */}
        <div className="rounded-lg border border-sidebar-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-success status-dot" />
            <span className="font-medium">Agents online</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            6 sources monitored · last scan 12s ago
          </p>
        </div>

        {/* User row */}
        {mounted && (userName || userEmail) && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="size-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold grid place-items-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              {userName && (
                <p className="text-xs font-medium truncate">{userName}</p>
              )}
              {userEmail && (
                <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
