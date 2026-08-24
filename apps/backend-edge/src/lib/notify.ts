import type { Env } from "../types";
import { HttpError, withRetry } from "./retry";

/**
 * Aviso fuera de la app (Slack, Teams, guardia de la clínica, lo que sea que
 * escuche en esa URL). Es opcional: si no hay webhook configurado, la alerta
 * igual queda en base y aparece en el panel.
 */
export async function notifyUrgency(env: Env, summary: string, patientId: string): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) {
    console.warn(`ALERT_WEBHOOK_URL sin configurar; la alerta solo queda en el panel: ${summary}`);
    return;
  }

  await withRetry(
    async () => {
      const res = await fetch(env.ALERT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summary, patient_id: patientId, source: "serena" }),
      });
      if (!res.ok) throw new HttpError(res.status, `notifyUrgency ${res.status}: ${await res.text()}`);
    },
    { label: "notifyUrgency", attempts: 4, baseDelayMs: 300 },
  );
}
