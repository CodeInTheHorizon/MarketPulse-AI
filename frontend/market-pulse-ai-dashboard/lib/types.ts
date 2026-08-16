// Shared domain types for the MarketPulse AI seller dashboard.

export type SkuStatus = "active" | "out_of_stock" | "delisted" | "unpublished"

// A single sellable variant. This is the granular unit an order is placed against.
export type Sku = {
  id: string
  productId: string
  variant: string // e.g. "Black / L"
  // The price we intend to charge (our source of truth / plan).
  listedPrice: number
  // The price currently live on the marketplace (authoritative once synced).
  marketplacePrice: number
  // Units we believe are in stock.
  stock: number
  // Units the marketplace reports as available.
  marketplaceStock: number
  status: SkuStatus
  // Whether this SKU is part of an active flash sale / promotion right now.
  onActiveSale: boolean
  updatedAt: number
}

export type Product = {
  id: string
  name: string
  category: string
  skus: Sku[]
}

// Why a SKU is risky. Load-bearing: these map directly to marketplace errors.
export type RiskReason =
  | "price_mismatch" // marketplace price != listed price
  | "oversold" // marketplace stock <= 0 while status active
  | "low_stock" // low but not zero
  | "delisted" // pulled from marketplace mid-sale
  | "unpublished" // never went live

export type Severity = "critical" | "warning" | "ok"
