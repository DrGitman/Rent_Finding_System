import type { ReactNode } from "react"
import { AppSidebar } from "./app-sidebar"
import { AppTopbar } from "./app-topbar"

export function AppShell({
  children,
  title,
}: {
  children: ReactNode
  title?: string
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppTopbar title={title} />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
