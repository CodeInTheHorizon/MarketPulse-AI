"use client"

import { useState } from "react"
import { CheckCircle2, CloudOff, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SyncStatus } from "@/lib/use-dashboard"
import type { Reconciliation } from "@/lib/reconcile"
import { formatUsd } from "@/lib/risk"

function diffValue(field: Reconciliation["diffs"][number]["field"], v: string | number) {
  if (field === "price") return formatUsd(Number(v))
  if (field === "status") return String(v).replace("_", " ")
  return String(v)
}

export function SyncBar({
  status,
  error,
  reconciliation,
  onSync,
  syncedAt,
}: {
  status: SyncStatus
  error: string | null
  reconciliation: Reconciliation | null
  onSync: (token: string) => void
  syncedAt: number | null
}) {
  const [token, setToken] = useState("demo-marketplace-token")

  const parityBroken = (reconciliation?.diffs.length ?? 0) > 0

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold">Authoritative marketplace sync</h3>
            <p className="text-xs text-muted-foreground">
              Live listing counts and active prices, straight from the marketplace API.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sync-token" className="sr-only">
            Marketplace sync token
          </label>
          <input
            id="sync-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token"
            className="w-40 rounded-md border bg-background px-2.5 py-1.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            onClick={() => onSync(token)}
            disabled={status === "syncing"}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw className={cn("size-4", status === "syncing" && "animate-spin")} aria-hidden />
            {status === "syncing" ? "Syncing" : "Sync now"}
          </button>
        </div>
      </div>

      <div className="p-4">
        {status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Not synced yet. Pull the authoritative snapshot to confirm the numbers on screen match
            the marketplace.
          </p>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm text-critical">
            <CloudOff className="size-4" aria-hidden />
            {error}
          </div>
        )}

        {reconciliation && status !== "error" && (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-medium",
                  parityBroken ? "text-warning-foreground" : "text-success",
                )}
              >
                {parityBroken ? (
                  <TriangleAlert className="size-4 text-warning" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                {parityBroken
                  ? `${reconciliation.diffs.length} parity break${reconciliation.diffs.length > 1 ? "s" : ""} reconciled`
                  : "Full parity — on-screen numbers match the marketplace"}
              </span>
              <span className="text-muted-foreground">
                {reconciliation.inParity}/{reconciliation.checked} SKUs in parity
              </span>
              {syncedAt && (
                <span className="text-muted-foreground">
                  Synced {new Date(syncedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {parityBroken && (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">SKU</th>
                      <th className="px-3 py-2 text-left font-medium">Field</th>
                      <th className="px-3 py-2 text-left font-medium">Was on screen</th>
                      <th className="px-3 py-2 text-left font-medium">Marketplace (now applied)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliation.diffs.map((d, i) => (
                      <tr key={`${d.skuId}-${d.field}-${i}`} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{d.variant}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{d.skuId}</div>
                        </td>
                        <td className="px-3 py-2 capitalize">{d.field}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground line-through">
                          {diffValue(d.field, d.local)}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-foreground">
                          {diffValue(d.field, d.marketplace)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
