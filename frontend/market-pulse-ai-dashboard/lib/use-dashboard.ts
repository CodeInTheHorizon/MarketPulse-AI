"use client"

import { useCallback, useMemo, useState } from "react"
import type { Product, Sku } from "./types"
import { initialProducts } from "./mock-data"
import {
  type AlertState,
  emptyAlertState,
  processSkuChange,
} from "./alerts"
import {
  type Reconciliation,
  applyMarketplaceTruth,
  reconcile,
} from "./reconcile"
import type { MarketplaceSyncResponse } from "@/app/api/marketplace/sync/route"

export type SyncStatus = "idle" | "syncing" | "synced" | "error"

// Central client store shared by the inventory table and the alert panel.
// A single source of SKU truth so a simulated change updates BOTH the
// visibility surface and the alert stream.
export function useDashboard() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [alertState, setAlertState] = useState<AlertState>(emptyAlertState)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [syncError, setSyncError] = useState<string | null>(null)
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null)

  const skuIndex = useMemo(() => {
    const map = new Map<string, Sku>()
    for (const p of products) for (const s of p.skus) map.set(s.id, s)
    return map
  }, [products])

  // Apply a mutation to a SKU and run it through the alert engine.
  const applyChange = useCallback((skuId: string, patch: Partial<Sku>) => {
    setProducts((prev) => {
      let changed: Sku | null = null
      const next = prev.map((p) => ({
        ...p,
        skus: p.skus.map((s) => {
          if (s.id !== skuId) return s
          changed = { ...s, ...patch, updatedAt: Date.now() }
          return changed
        }),
      }))
      if (changed) {
        setAlertState((st) => processSkuChange(st, changed as Sku, Date.now()))
      }
      return next
    })
  }, [])

  const resetAlerts = useCallback(() => setAlertState(emptyAlertState()), [])

  // Pull the authoritative marketplace snapshot, reconcile against local state,
  // then apply the truth so on-screen numbers == marketplace numbers.
  const sync = useCallback(
    async (token: string) => {
      setSyncStatus("syncing")
      setSyncError(null)
      try {
        const res = await fetch("/api/marketplace/sync", {
          headers: { authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Sync failed (${res.status})`)
        }
        const data: MarketplaceSyncResponse = await res.json()

        setProducts((prev) => {
          setReconciliation(reconcile(prev, data.skus, data.syncedAt))
          return applyMarketplaceTruth(prev, data.skus)
        })
        setSyncStatus("synced")
      } catch (e) {
        setSyncStatus("error")
        setSyncError(e instanceof Error ? e.message : "Unknown error")
      }
    },
    [],
  )

  return {
    products,
    alertState,
    applyChange,
    resetAlerts,
    skuIndex,
    sync,
    syncStatus,
    syncError,
    reconciliation,
  }
}
