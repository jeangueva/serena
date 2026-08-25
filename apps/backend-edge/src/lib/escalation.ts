import type { UrgencyAlert } from "@serena/types";
import type { Env } from "../types";
import { markEscalated, pendingUnescalatedAlerts, patientNames, serviceClient } from "./db";
import { notifyEscalation } from "./notify";

/** Minutos que una alerta puede quedar sin acuse de recibo antes de reenviarse. */
export const DEFAULT_ESCALATION_MINUTES = 10;

/**
 * Decide si una alerta ya esperó demasiado. Puro a propósito: la regla que
 * define cuándo nadie atendió una urgencia tiene que ser testeable sin red.
 */
export function isOverdue(
  alert: Pick<UrgencyAlert, "created_at" | "acknowledged_at" | "escalated_at">,
  now: Date,
  minutes: number,
): boolean {
  if (alert.acknowledged_at !== null) return false; // ya la atendieron
  if (alert.escalated_at !== null) return false; // ya se reenvió una vez
  const edadMs = now.getTime() - new Date(alert.created_at).getTime();
  return edadMs >= minutes * 60_000;
}

export function buildEscalationSummary(
  patientName: string,
  motivo: string,
  minutosEsperando: number,
): string {
  return (
    `URGENCIA SIN ATENDER (${minutosEsperando} min) · ${patientName}: ${motivo}. ` +
    `Nadie acusó recibo en el panel.`
  );
}

export function minutesSince(createdAt: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60_000);
}

/**
 * Barrido que corre el cron. Reenvía el aviso de las alertas vencidas y las
 * marca, para no repetir el mismo aviso cada cinco minutos hasta el infinito.
 * Devuelve cuántas escaló.
 */
export async function runEscalationSweep(env: Env, now: Date = new Date()): Promise<number> {
  const minutes = Number(env.ESCALATION_MINUTES) || DEFAULT_ESCALATION_MINUTES;
  const db = serviceClient(env);

  const candidatas = await pendingUnescalatedAlerts(db);
  const vencidas = candidatas.filter((alert) => isOverdue(alert, now, minutes));
  if (vencidas.length === 0) return 0;

  const nombres = await patientNames(db, [...new Set(vencidas.map((a) => a.patient_id))]);

  const escaladas: string[] = [];
  for (const alert of vencidas) {
    const resumen = buildEscalationSummary(
      nombres.get(alert.patient_id) ?? "Paciente",
      alert.motivo,
      minutesSince(alert.created_at, now),
    );

    try {
      await notifyEscalation(env, resumen, alert.patient_id);
      escaladas.push(alert.id);
    } catch (err) {
      // Sin marcar: el próximo barrido lo vuelve a intentar. Perder un
      // reintento es preferible a dar por avisada una urgencia que no lo está.
      console.error(`Escalado falló para la alerta ${alert.id}, se reintenta:`, err);
    }
  }

  if (escaladas.length > 0) await markEscalated(db, escaladas, now);
  return escaladas.length;
}
