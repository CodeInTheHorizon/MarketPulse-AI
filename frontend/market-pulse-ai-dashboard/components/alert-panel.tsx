"use client"

import { Bell, BellRing, Inbox, Layers, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Alert, AlertState } from "@/lib/alerts"
import { DEBOUNCE_MS } from "@/lib/alerts"
import type { Sku } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SeverityBadge } from "./severity-badge"

function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  return `${m}m ago`
}

function AlertRow({ alert, now }: { alert: Alert; now: number }) {
  const push = alert.channel === "push"
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        push ? "border-critical/30 bg-critical/5" : "border-border bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {push ? (
            <BellRing className="size-4 text-critical" aria-hidden />
          ) : (
            <Inbox className="size-4 text-muted-foreground" aria-hidden />
          )}
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {push ? "Push" : "Digest"}
          </span>
        </div>
        <SeverityBadge severity={alert.severity} />
      </div>
      <p className="mt-1.5 text-sm">{alert.message}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{timeAgo(alert.createdAt, now)}</span>
        {alert.coalesced > 0 && (
          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
            <Layers className="size-3" aria-hidden />+{alert.coalesced} folded
          </span>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "critical" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-xl font-semibold tabular-nums", tone === "critical" && "text-critical")}>
        {value}
      </div>
    </div>
  )
}

// Small set of scripted "marketplace changes" so debounce + priority are
// demonstrable. Each returns a target sku id + patch.
export type SimEvent = { label: string; skuId: string; patch: Partial<Sku> }

export function AlertPanel({
  alertState,
  onSimulate,
  onReset,
  now,
}: {
  alertState: AlertState
  onSimulate: (e: SimEvent) => void
  onReset: () => void
  now: number
}) {
  const pushCount = alertState.alerts.filter((a) => a.channel === "push").length
  const digestCount = alertState.alerts.filter((a) => a.channel === "digest").length

  const sims: SimEvent[] = [
    {
      label: "Flash-sale price drops to $12 (critical push)",
      skuId: "s_helios_wh",
      patch: { marketplacePrice: 12, onActiveSale: true },
    },
    {
      label: "Active SKU oversells to 0 (critical push)",
      skuId: "s_lumen_bk",
      patch: { marketplaceStock: 0, status: "out_of_stock" },
    },
    {
      label: "Stock dips low, not zero (warning digest)",
      skuId: "s_terra_10",
      patch: { marketplaceStock: 6 },
    },
    {
      label: "Re-fire same SKU x3 (debounce folds)",
      skuId: "s_helios_wh",
      patch: { marketplacePrice: 10, onActiveSale: true },
    },
  ]

  return (
    <div className="flex h-full flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Bell className="size-4" aria-hidden />
          <h3 className="text-sm font-semibold">Real-time alerts</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 pb-2">
        <Stat label="Pushed" value={pushCount} tone="critical" />
        <Stat label="Digest" value={digestCount} />
        <Stat label="Folded" value={alertState.suppressedCount} />
      </div>

      <div className="px-4 pb-2">
        <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="size-3.5" aria-hidden />
          Simulate marketplace changes · debounce {DEBOUNCE_MS / 1000}s per SKU
        </p>
        <div className="grid gap-1.5">
          {sims.map((s) => (
            <button
              key={s.label}
              onClick={() => onSimulate(s)}
              className="rounded-md border bg-background px-2.5 py-1.5 text-left text-xs font-medium transition-colors hover:bg-accent"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 border-t">
        <ScrollArea className="h-full">
          <div className="grid gap-2 p-4">
            {alertState.alerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No alerts yet. Trigger a change to see the cadence in action.
              </p>
            ) : (
              alertState.alerts.map((a) => <AlertRow key={a.id} alert={a} now={now} />)
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
