import type { Product, Sku } from "./types"
import type { MarketplaceSkuSnapshot } from "@/app/api/marketplace/sync/route"

export type FieldDiff = {
  skuId: string
  variant: string
  field: "price" | "stock" | "status"
  local: string | number
  marketplace: string | number
}

export type Reconciliation = {
  syncedAt: number
  checked: number
  inParity: number
  diffs: FieldDiff[]
}

// Diff local SKU state against the authoritative marketplace snapshot.
// Any field that disagrees is a parity break — the on-screen number is NOT
// the number to act on until reconciled.
export function reconcile(
  products: Product[],
  snapshots: MarketplaceSkuSnapshot[],
  syncedAt: number,
): Reconciliation {
  const byId = new Map(snapshots.map((s) => [s.skuId, s]))
  const diffs: FieldDiff[] = []
  let checked = 0

  for (const p of products) {
    for (const s of p.skus) {
      const truth = byId.get(s.id)
      if (!truth) continue
      checked++

      if (Math.abs(truth.marketplacePrice - s.marketplacePrice) > 0.001) {
        diffs.push({
          skuId: s.id,
          variant: s.variant,
          field: "price",
          local: s.marketplacePrice,
          marketplace: truth.marketplacePrice,
        })
      }
      if (truth.marketplaceStock !== s.marketplaceStock) {
        diffs.push({
          skuId: s.id,
          variant: s.variant,
          field: "stock",
          local: s.marketplaceStock,
          marketplace: truth.marketplaceStock,
        })
      }
      if (truth.status !== s.status) {
        diffs.push({
          skuId: s.id,
          variant: s.variant,
          field: "status",
          local: s.status,
          marketplace: truth.status,
        })
      }
    }
  }

  const skusWithDiff = new Set(diffs.map((d) => d.skuId)).size
  return {
    syncedAt,
    checked,
    inParity: checked - skusWithDiff,
    diffs,
  }
}

// Apply the authoritative snapshot onto local products — after this the
// on-screen numbers equal the marketplace numbers.
export function applyMarketplaceTruth(
  products: Product[],
  snapshots: MarketplaceSkuSnapshot[],
): Product[] {
  const byId = new Map(snapshots.map((s) => [s.skuId, s]))
  return products.map((p) => ({
    ...p,
    skus: p.skus.map((s): Sku => {
      const truth = byId.get(s.id)
      if (!truth) return s
      return {
        ...s,
        marketplacePrice: truth.marketplacePrice,
        marketplaceStock: truth.marketplaceStock,
        status: truth.status,
        updatedAt: Date.now(),
      }
    }),
  }))
}
