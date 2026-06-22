"use client"

import { Search, Bell, Sun, Moon, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function AppTopbar({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [initials, setInitials] = useState("RS")

  useEffect(() => {
    setMounted(true)
    const name = localStorage.getItem("rs_user_name")
    const email = localStorage.getItem("rs_user_email")
    if (name) {
      setInitials(
        name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
      )
    } else if (email) {
      setInitials(email.slice(0, 2).toUpperCase())
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("rs_token")
    localStorage.removeItem("rs_refresh_token")
    localStorage.removeItem("rs_user_id")
    localStorage.removeItem("rs_user_email")
    localStorage.removeItem("rs_user_name")
    document.cookie = "rs_token=; path=/; max-age=0"
    router.push("/auth")
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border">
      <div className="h-14 flex items-center gap-3 px-4 md:px-6">
        {title && (
          <div className="font-semibold text-sm tracking-tight md:hidden">
            {title}
          </div>
        )}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search results, alerts, activity…"
              className="w-full h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring"
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="size-9"
        >
          {mounted && theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="size-9 relative"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
          </Button>
        </Link>

        <Avatar className="size-8 cursor-pointer" onClick={handleLogout} title="Sign out">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
