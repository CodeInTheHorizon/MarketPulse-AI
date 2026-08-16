import { NextResponse } from "next/server"
import { initialProducts } from "@/lib/mock-data"
import type { SkuStatus } from "@/lib/types"

// Authoritative marketplace sync endpoint.
// Returns the LIVE listing counts and active prices as the marketplace sees
// them. This is the source of operational truth during the busy sale hour —
// the numbers you read here are the numbers you act on.
//
// Auth: a shared token. In production this would be an OAuth token / signed
// request to the marketplace API. Here we gate on a bearer token so the shape
// of an authenticated sync is real.

// Configure via env (MARKETPLACE_SYNC_TOKEN). Falls back to a demo token so the
// dashboard works out of the box in the preview.
const EXPECTED_TOKEN = process.env.MARKETPLACE_SYNC_TOKEN ?? "demo-marketplace-token"

export type MarketplaceSkuSnapshot = {
  skuId: string
  marketplacePrice: number
  marketplaceStock: number
  status: SkuStatus
}

export type MarketplaceSyncResponse = {
  syncedAt: number
  source: "marketplace-live"
  skus: MarketplaceSkuSnapshot[]
}

// Simulate the authoritative marketplace state. During a real sale hour this
// drifts from local state; we inject a couple of deliberate divergences so the
// reconciliation surface has something to catch.
function marketplaceTruth(): MarketplaceSkuSnapshot[] {
  const snapshots: MarketplaceSkuSnapshot[] = []
  for (const p of initialProducts) {
    for (const s of p.skus) {
      snapshots.push({
        skuId: s.id,
        marketplacePrice: s.marketplacePrice,
        marketplaceStock: s.marketplaceStock,
        status: s.status,
      })
    }
  }

  // Deliberate live drift (what the marketplace actually shows right now):
  // an Aurora variant's price ticked, and a Terra SKU sold down further.
  for (const snap of snapshots) {
    if (snap.skuId === "s_aurora_wt_9") snap.marketplaceStock = 3
    if (snap.skuId === "s_terra_12") snap.marketplacePrice = 49.99
  }

  return snapshots
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const token = auth?.replace(/^Bearer\s+/i, "")

  if (!token || token !== EXPECTED_TOKEN) {
    return NextResponse.json(
      { error: "Unauthorized. Provide a valid marketplace sync token." },
      { status: 401 },
    )
  }

  const response: MarketplaceSyncResponse = {
    syncedAt: Date.now(),
    source: "marketplace-live",
    skus: marketplaceTruth(),
  }

  return NextResponse.json(response, {
    headers: { "cache-control": "no-store" },
  })
}
