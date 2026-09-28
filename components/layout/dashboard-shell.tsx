import { Sidebar } from "./sidebar"
import { MobileBottomNav, MobileTopBar } from "./mobile-nav"

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <MobileTopBar />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  )
}

// Contenedor scrolleable estándar de cada página.
export function PageBody({
  children,
  width = "default",
}: {
  children: React.ReactNode
  width?: "narrow" | "default" | "wide"
}) {
  const max =
    width === "narrow" ? "max-w-3xl" : width === "wide" ? "max-w-6xl" : "max-w-5xl"
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`mx-auto w-full ${max} px-4 py-5 md:px-8 md:py-8`}>
        {children}
      </div>
    </div>
  )
}
