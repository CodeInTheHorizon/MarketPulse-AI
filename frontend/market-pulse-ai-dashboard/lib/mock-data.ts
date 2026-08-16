import type { Product } from "./types"

const now = Date.now()

// Seed catalog. Deliberately includes products that look fine at the rollup
// level but hide a single risky SKU (price mismatch / oversold / delisted).
export const initialProducts: Product[] = [
  {
    id: "p_aurora",
    name: "Aurora Running Shoe",
    category: "Footwear",
    skus: [
      { id: "s_aurora_bl_9", productId: "p_aurora", variant: "Black / 9", listedPrice: 89.0, marketplacePrice: 89.0, stock: 120, marketplaceStock: 118, status: "active", onActiveSale: true, updatedAt: now },
      { id: "s_aurora_bl_10", productId: "p_aurora", variant: "Black / 10", listedPrice: 89.0, marketplacePrice: 44.5, stock: 90, marketplaceStock: 88, status: "active", onActiveSale: true, updatedAt: now },
      { id: "s_aurora_wt_9", productId: "p_aurora", variant: "White / 9", listedPrice: 89.0, marketplacePrice: 89.0, stock: 60, marketplaceStock: 7, status: "active", onActiveSale: true, updatedAt: now },
    ],
  },
  {
    id: "p_helios",
    name: "Helios Wireless Earbuds",
    category: "Audio",
    skus: [
      { id: "s_helios_wh", productId: "p_helios", variant: "White", listedPrice: 129.0, marketplacePrice: 129.0, stock: 340, marketplaceStock: 331, status: "active", onActiveSale: true, updatedAt: now },
      { id: "s_helios_bk", productId: "p_helios", variant: "Black", listedPrice: 129.0, marketplacePrice: 129.0, stock: 0, marketplaceStock: 0, status: "out_of_stock", onActiveSale: true, updatedAt: now },
    ],
  },
  {
    id: "p_nimbus",
    name: "Nimbus Down Jacket",
    category: "Apparel",
    skus: [
      { id: "s_nimbus_s", productId: "p_nimbus", variant: "S", listedPrice: 210.0, marketplacePrice: 210.0, stock: 40, marketplaceStock: 39, status: "active", onActiveSale: false, updatedAt: now },
      { id: "s_nimbus_m", productId: "p_nimbus", variant: "M", listedPrice: 210.0, marketplacePrice: 210.0, stock: 55, marketplaceStock: 52, status: "active", onActiveSale: false, updatedAt: now },
      { id: "s_nimbus_l", productId: "p_nimbus", variant: "L", listedPrice: 210.0, marketplacePrice: 210.0, stock: 0, marketplaceStock: 0, status: "delisted", onActiveSale: false, updatedAt: now },
    ],
  },
  {
    id: "p_terra",
    name: "Terra Cast Iron Skillet",
    category: "Home",
    skus: [
      { id: "s_terra_10", productId: "p_terra", variant: '10"', listedPrice: 45.0, marketplacePrice: 45.0, stock: 500, marketplaceStock: 480, status: "active", onActiveSale: false, updatedAt: now },
      { id: "s_terra_12", productId: "p_terra", variant: '12"', listedPrice: 55.0, marketplacePrice: 55.0, stock: 420, marketplaceStock: 410, status: "active", onActiveSale: false, updatedAt: now },
    ],
  },
  {
    id: "p_lumen",
    name: "Lumen Desk Lamp",
    category: "Home",
    skus: [
      { id: "s_lumen_wh", productId: "p_lumen", variant: "White", listedPrice: 72.0, marketplacePrice: 72.0, stock: 80, marketplaceStock: 9, status: "active", onActiveSale: true, updatedAt: now },
      { id: "s_lumen_bk", productId: "p_lumen", variant: "Black", listedPrice: 72.0, marketplacePrice: 72.0, stock: 140, marketplaceStock: 133, status: "active", onActiveSale: true, updatedAt: now },
      { id: "s_lumen_wd", productId: "p_lumen", variant: "Walnut", listedPrice: 84.0, marketplacePrice: 84.0, stock: 0, marketplaceStock: 0, status: "unpublished", onActiveSale: false, updatedAt: now },
    ],
  },
]
