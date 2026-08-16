import type { RiskReason, Severity, Sku } from "./types"
import { evaluateSku, REASON_LABEL } from "./risk"

export type AlertChannel = "push" | "digest"

export type Alert = {
  id: string
  skuId: string
  productId: string
  variant: string
  severity: Severity
  reasons: RiskReason[]
  channel: AlertChannel
  message: string
  createdAt: number
  // How many raw events this alert coalesced (debounce fold count).
  coalesced: number
}

// Debounce window: repeated changes to the SAME sku inside this window
// fold into the existing alert instead of firing again. Prevents the
// re-fire flood that trains sellers to mute everything at peak.
export const DEBOUNCE_MS = 8000

// Routing rule (the hybrid cadence):
// - critical  -> push immediately (loses/mis-prices an order right now)
// - warning   -> digest (batched, low interruption)
// - ok        -> no alert
export function channelFor(severity: Severity): AlertChannel | null {
  if (severity === "critical") return "push"
  if (severity === "warning") return "digest"
  return null
}

function messageFor(sku: Sku, reasons: RiskReason[]): string {
  const label = reasons.map((r) => REASON_LABEL[r]).join(", ")
  const sale = sku.onActiveSale ? " during active sale" : ""
  return `${sku.variant} (${sku.id}) — ${label}${sale}`
}

export type AlertState = {
  alerts: Alert[]
  // last time a given sku produced an alert, for debounce.
  lastFiredAt: Record<string, number>
  suppressedCount: number // events folded away by debounce
}

export function emptyAlertState(): AlertState {
  return { alerts: [], lastFiredAt: {}, suppressedCount: 0 }
}

// Process one SKU change into the alert state. Pure and deterministic so it is
// easy to test and reason about at peak load.
export function processSkuChange(
  state: AlertState,
  sku: Sku,
  now: number,
): AlertState {
  const { reasons, severity } = evaluateSku(sku)
  const channel = channelFor(severity)

  // No risk -> nothing to alert. (We keep any prior alerts as history.)
  if (!channel || reasons.length === 0) return state

  const last = state.lastFiredAt[sku.id] ?? 0
  const withinDebounce = now - last < DEBOUNCE_MS

  // Debounce: fold into the most recent alert for this SKU rather than firing
  // a new one. This is the key fatigue guard.
  if (withinDebounce) {
    const idx = [...state.alerts].reverse().findIndex((a) => a.skuId === sku.id)
    if (idx !== -1) {
      const realIdx = state.alerts.length - 1 - idx
      const existing = state.alerts[realIdx]
      const updated: Alert = {
        ...existing,
        severity,
        reasons,
        channel,
        message: messageFor(sku, reasons),
        coalesced: existing.coalesced + 1,
        createdAt: now,
      }
      const alerts = [...state.alerts]
      alerts[realIdx] = updated
      return { ...state, alerts, suppressedCount: state.suppressedCount + 1 }
    }
  }

  const alert: Alert = {
    id: `${sku.id}_${now}`,
    skuId: sku.id,
    productId: sku.productId,
    variant: sku.variant,
    severity,
    reasons,
    channel,
    message: messageFor(sku, reasons),
    createdAt: now,
    coalesced: 0,
  }

  return {
    alerts: [alert, ...state.alerts].slice(0, 100),
    lastFiredAt: { ...state.lastFiredAt, [sku.id]: now },
    suppressedCount: state.suppressedCount,
  }
}
