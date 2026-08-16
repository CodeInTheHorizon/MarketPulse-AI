import { Activity } from "lucide-react"

export function DashboardHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">MarketPulse AI</h1>
            <p className="text-xs text-muted-foreground">Seller intelligence dashboard</p>
          </div>
        </div>
        {right}
      </div>
    </header>
  )
}
