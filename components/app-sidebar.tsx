"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  ListFilter,
  Map,
  Bell,
  Activity,
  Inbox,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/results", label: "Results", icon: ListFilter },
  { href: "/map", label: "Map", icon: Map },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/notifications", label: "Notifications", icon: Inbox },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="size-8 rounded-md bg-primary text-primary-foreground grid place-items-center">
          <Sparkles className="size-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Renta</div>
          <div className="text-[11px] text-muted-foreground">Rental intelligence</div>
        </div>
      </div>

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
              {item.href === "/alerts" && (
                <span className="ml-auto text-[10px] font-medium rounded-full bg-primary text-primary-foreground px-1.5 py-0.5">
                  2
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="rounded-lg border border-sidebar-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-success status-dot" />
            <span className="font-medium">Agents online</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            6 sources monitored. Last scan 12s ago.
          </p>
        </div>
      </div>
    </aside>
  )
}
