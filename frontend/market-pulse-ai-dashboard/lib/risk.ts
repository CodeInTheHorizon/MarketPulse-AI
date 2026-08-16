import type { Product, RiskReason, Severity, Sku } from "./types"

const LOW_STOCK_THRESHOLD = 10

// Evaluate a single SKU into concrete, actionable risk reasons.
// This is the core of "surface one wrong variant" — the logic that keeps a bad
// SKU from hiding inside a healthy-looking product rollup.
export function evaluateSku(sku: Sku): { reasons: RiskReason[]; severity: Severity } {
  const reasons: RiskReason[] = []

  if (sku.status === "delisted") reasons.push("delisted")
  if (sku.status === "unpublished") reasons.push("unpublished")

  const priceMismatch = Math.abs(sku.marketplacePrice - sku.listedPrice) > 0.001
  if (priceMismatch) reasons.push("price_mismatch")

  if (sku.status === "active") {
    if (sku.marketplaceStock <= 0 || sku.status === "out_of_stock") reasons.push("oversold")
    else if (sku.marketplaceStock <= LOW_STOCK_THRESHOLD) reasons.push("low_stock")
  }
  if (sku.status === "out_of_stock") reasons.push("oversold")

  return { reasons, severity: severityFor(reasons, sku) }
}

// A risk is critical when it costs or mis-prices an order RIGHT NOW,
// escalated further when the SKU is in an active sale.
function severityFor(reasons: RiskReason[], sku: Sku): Severity {
  if (reasons.length === 0) return "ok"

  const hasCritical = reasons.some((r) => {
    if (r === "price_mismatch") return sku.onActiveSale // wrong price during a sale = critical
    if (r === "oversold") return true
    if (r === "delisted") return true
    return false
  })
  if (hasCritical) return "critical"
  return "warning"
}

export type ProductRollup = {
  product: Product
  skuCount: number
  activePriceRange: [number, number]
  totalStock: number
  liveListings: number // count of SKUs live on the marketplace
  severity: Severity
  riskySkuCount: number
  reasonsSummary: RiskReason[]
}

// Roll SKUs up to product level while preserving the WORST severity —
// a product-level summary should never look calmer than its riskiest SKU.
export function rollupProduct(product: Product): ProductRollup {
  const prices = product.skus.map((s) => s.marketplacePrice)
  let worst: Severity = "ok"
  let riskySkuCount = 0
  const reasonsSet = new Set<RiskReason>()

  for (const sku of product.skus) {
    const { reasons, severity } = evaluateSku(sku)
    if (reasons.length > 0) riskySkuCount++
    reasons.forEach((r) => reasonsSet.add(r))
    if (severity === "critical") worst = "critical"
    else if (severity === "warning" && worst !== "critical") worst = "warning"
  }

  return {
    product,
    skuCount: product.skus.length,
    activePriceRange: [Math.min(...prices), Math.max(...prices)],
    totalStock: product.skus.reduce((a, s) => a + s.marketplaceStock, 0),
    liveListings: product.skus.filter((s) => s.status === "active").length,
    severity: worst,
    riskySkuCount,
    reasonsSummary: [...reasonsSet],
  }
}

export const REASON_LABEL: Record<RiskReason, string> = {
  price_mismatch: "Price mismatch",
  oversold: "Oversold / out of stock",
  low_stock: "Low stock",
  delisted: "Delisted",
  unpublished: "Unpublished",
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
}
