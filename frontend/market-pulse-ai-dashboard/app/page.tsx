import { DashboardHeader } from "@/components/dashboard-header"
import { Dashboard } from "@/components/dashboard"

export default function Page() {
  return (
    <main className="min-h-dvh">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Dashboard />
      </div>
    </main>
  )
}
