import { AlertTriangle, CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Severity } from "@/lib/types"

const MAP = {
  critical: {
    label: "Critical",
    icon: CircleAlert,
    cls: "bg-critical/12 text-critical border-critical/30",
  },
  warning: {
    label: "Warning",
    icon: AlertTriangle,
    cls: "bg-warning/15 text-warning-foreground border-warning/40",
  },
  ok: {
    label: "Healthy",
    icon: CircleCheck,
    cls: "bg-success/12 text-success border-success/30",
  },
} as const

export function SeverityBadge({
  severity,
  count,
  className,
}: {
  severity: Severity
  count?: number
  className?: string
}) {
  const { label, icon: Icon, cls } = MAP[severity]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {severity === "ok" || count == null ? label : `${count} ${label.toLowerCase()}`}
    </span>
  )
}
