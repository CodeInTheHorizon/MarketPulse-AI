"use client"

import { useMemo, useState } from "react"
import { ChevronRight, Filter, Layers, List } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Product, Sku } from "@/lib/types"
import { evaluateSku, formatUsd, rollupProduct } from "@/lib/risk"
import { SeverityBadge } from "./severity-badge"
import { ReasonPills } from "./reason-pills"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ViewMode = "product" | "sku"

function ToggleGroup({
  view,
  onChange,
}: {
  view: ViewMode
  onChange: (v: ViewMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Inventory granularity"
      className="inline-flex items-center rounded-lg border bg-muted p-0.5"
    >
      {(
        [
          { id: "product", label: "Product rollup", icon: Layers },
          { id: "sku", label: "SKU level", icon: List },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={view === id}
          onClick={() => onChange(id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}

function PriceCell({ sku }: { sku: Sku }) {
  const mismatch = Math.abs(sku.marketplacePrice - sku.listedPrice) > 0.001
  return (
    <div className="font-mono text-sm">
      <span className={cn(mismatch && "text-critical font-semibold")}>
        {formatUsd(sku.marketplacePrice)}
      </span>
      {mismatch && (
        <span className="ml-1.5 text-xs text-muted-foreground line-through">
          {formatUsd(sku.listedPrice)}
        </span>
      )}
    </div>
  )
}

function SkuRow({ sku, nested }: { sku: Sku; nested?: boolean }) {
  const { reasons, severity } = evaluateSku(sku)
  return (
    <TableRow className={cn(nested && "bg-muted/30")}>
      <TableCell className={cn("font-medium", nested && "pl-10")}>
        <div className="flex items-center gap-2">
          {sku.onActiveSale && (
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-label="On active sale"
              title="On active sale"
            />
          )}
          {sku.variant}
        </div>
        <div className="font-mono text-[11px] text-muted-foreground">{sku.id}</div>
      </TableCell>
      <TableCell>
        <PriceCell sku={sku} />
      </TableCell>
      <TableCell className="font-mono text-sm">{sku.marketplaceStock}</TableCell>
      <TableCell className="capitalize text-sm text-muted-foreground">
        {sku.status.replace("_", " ")}
      </TableCell>
      <TableCell>
        <ReasonPills reasons={reasons} />
      </TableCell>
      <TableCell className="text-right">
        <SeverityBadge severity={severity} />
      </TableCell>
    </TableRow>
  )
}

function ProductRow({
  product,
  riskyOnly,
}: {
  product: Product
  riskyOnly: boolean
}) {
  const [open, setOpen] = useState(false)
  const rollup = useMemo(() => rollupProduct(product), [product])
  const [lo, hi] = rollup.activePriceRange

  // Auto-expand risky products so the wrong variant is one glance away.
  const expanded = open || (riskyOnly && rollup.severity !== "ok")

  const visibleSkus = riskyOnly
    ? product.skus.filter((s) => evaluateSku(s).reasons.length > 0)
    : product.skus

  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={expanded}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <ChevronRight
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                expanded && "rotate-90",
              )}
              aria-hidden
            />
            <div>
              <div>{product.name}</div>
              <div className="text-xs text-muted-foreground">
                {product.category} · {rollup.skuCount} SKUs
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="font-mono text-sm">
          {lo === hi ? formatUsd(lo) : `${formatUsd(lo)}–${formatUsd(hi)}`}
        </TableCell>
        <TableCell className="font-mono text-sm">{rollup.totalStock}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {rollup.liveListings}/{rollup.skuCount} live
        </TableCell>
        <TableCell>
          <ReasonPills reasons={rollup.reasonsSummary} />
        </TableCell>
        <TableCell className="text-right">
          <SeverityBadge
            severity={rollup.severity}
            count={rollup.riskySkuCount || undefined}
          />
        </TableCell>
      </TableRow>
      {expanded &&
        visibleSkus.map((sku) => <SkuRow key={sku.id} sku={sku} nested />)}
    </>
  )
}

export function InventoryTable({ products }: { products: Product[] }) {
  const [view, setView] = useState<ViewMode>("product")
  const [riskyOnly, setRiskyOnly] = useState(false)

  const allSkus = useMemo(() => products.flatMap((p) => p.skus), [products])

  const skuRows = riskyOnly
    ? allSkus.filter((s) => evaluateSku(s).reasons.length > 0)
    : allSkus

  const productRows = riskyOnly
    ? products.filter((p) => rollupProduct(p).severity !== "ok")
    : products

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-3">
          <ToggleGroup view={view} onChange={setView} />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {view === "product"
              ? "Fast scanning. Risky products auto-expand."
              : "Every variant, flat. Nothing hides in an average."}
          </span>
        </div>
        <button
          onClick={() => setRiskyOnly((r) => !r)}
          aria-pressed={riskyOnly}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            riskyOnly
              ? "border-critical/40 bg-critical/10 text-critical"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="size-4" aria-hidden />
          Risky only
        </button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{view === "product" ? "Product" : "SKU"}</TableHead>
            <TableHead>Active price</TableHead>
            <TableHead>Live stock</TableHead>
            <TableHead>{view === "product" ? "Listings" : "Status"}</TableHead>
            <TableHead>Signals</TableHead>
            <TableHead className="text-right">Severity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {view === "product"
            ? productRows.map((p) => (
                <ProductRow key={p.id} product={p} riskyOnly={riskyOnly} />
              ))
            : skuRows.map((s) => <SkuRow key={s.id} sku={s} />)}
          {((view === "product" && productRows.length === 0) ||
            (view === "sku" && skuRows.length === 0)) && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No risky items. Everything is in parity with the marketplace.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
