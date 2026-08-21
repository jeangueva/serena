import { cn } from "@/lib/utils";

/** Barra de avance del onboarding. Sin animacion: es un dato, no un adorno. */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
