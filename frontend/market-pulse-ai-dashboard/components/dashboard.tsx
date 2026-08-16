"use client"

import { useEffect, useState } from "react"
import { useDashboard } from "@/lib/use-dashboard"
import { InventoryTable } from "./inventory-table"
import { AlertPanel, type SimEvent } from "./alert-panel"
import { SyncBar } from "./sync-bar"

export function Dashboard() {
  const {
    products,
    alertState,
    applyChange,
    resetAlerts,
    sync,
    syncStatus,
    syncError,
    reconciliation,
  } = useDashboard()

  // Ticking clock so relative timestamps stay live.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const onSimulate = (e: SimEvent) => applyChange(e.skuId, e.patch)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-5">
        <SyncBar
          status={syncStatus}
          error={syncError}
          reconciliation={reconciliation}
          onSync={sync}
          syncedAt={reconciliation?.syncedAt ?? null}
        />
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Inventory visibility</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              Product rollups for fast scanning. Toggle to SKU level, or filter to risky only, so a
              single wrong variant never hides inside a healthy-looking product.
            </p>
          </div>
          <InventoryTable products={products} />
        </div>
      </div>
      <aside className="lg:h-[calc(100dvh-8rem)] lg:sticky lg:top-6">
        <AlertPanel
          alertState={alertState}
          onSimulate={onSimulate}
          onReset={resetAlerts}
          now={now}
        />
      </aside>
    </div>
  )
}
