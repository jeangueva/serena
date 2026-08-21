import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** "5491133334444" -> "+54 9 11 3333 4444" (agrupado, legible de un vistazo). */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return raw;
  return `+${digits.slice(0, digits.length - 8)} ${digits.slice(-8, -4)} ${digits.slice(-4)}`.replace(/\s+/g, " ");
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
