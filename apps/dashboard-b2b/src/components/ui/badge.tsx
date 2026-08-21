import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { PatientStatus } from "@serena/types";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-canvas text-ink-soft ring-1 ring-line ring-inset",
      warn: "bg-warn-soft text-warn",
      ok: "bg-ok-soft text-ok",
      accent: "bg-accent-soft text-accent",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

const STATUS_META: Record<PatientStatus, { label: string; tone: "neutral" | "warn" | "ok" }> = {
  pending_onboarding: { label: "Sin iniciar", tone: "neutral" },
  in_progress: { label: "En curso", tone: "warn" },
  completed: { label: "Completado", tone: "ok" },
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
