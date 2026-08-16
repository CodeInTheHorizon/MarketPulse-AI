import { cn } from "@/lib/utils"
import { REASON_LABEL } from "@/lib/risk"
import type { RiskReason } from "@/lib/types"

const CRITICAL_REASONS: RiskReason[] = ["oversold", "delisted"]

export function ReasonPills({ reasons }: { reasons: RiskReason[] }) {
  if (reasons.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {reasons.map((r) => (
        <span
          key={r}
          className={cn(
            "rounded border px-1.5 py-0.5 text-[11px] font-medium",
            CRITICAL_REASONS.includes(r)
              ? "border-critical/30 bg-critical/10 text-critical"
              : "border-warning/40 bg-warning/15 text-warning-foreground",
          )}
        >
          {REASON_LABEL[r]}
        </span>
      ))}
    </div>
  )
}
