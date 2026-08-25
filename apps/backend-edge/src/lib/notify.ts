import type { Env } from "../types";
import { HttpError, withRetry } from "./retry";

export type NotificationKind = "urgency" | "escalation";

export interface WebhookTarget {
  url: string;
  /** true cuando el escalado reusa el canal del primer aviso por falta de uno propio. */
  isFallback: boolean;
}

/**
 * A dónde va el reenvío de una alerta que nadie atendió.
 * Si no hay canal propio, cae al del primer aviso — pero eso es justamente el
 * canal que ya se ignoró una vez, así que se avisa fuerte en el log.
 * Puro para poder testear la resolución sin red.
 */
export function resolveEscalationTarget(env: Pick<Env, "ALERT_WEBHOOK_URL" | "ESCALATION_WEBHOOK_URL">): WebhookTarget | null {
  const propio = env.ESCALATION_WEBHOOK_URL?.trim();
  if (propio) return { url: propio, isFallback: false };

  const primario = env.ALERT_WEBHOOK_URL?.trim();
  if (primario) return { url: primario, isFallback: true };

  return null;
}

/** Primer aviso de urgencia: sale por el canal habitual de la clínica. */
export async function notifyUrgency(env: Env, summary: string, patientId: string): Promise<void> {
  const url = env.ALERT_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn(`ALERT_WEBHOOK_URL sin configurar; la alerta solo queda en el panel: ${summary}`);
    return;
  }
  await post(url, summary, patientId, "urgency");
}

/**
 * Reenvío de una alerta sin acuse de recibo. Va por `ESCALATION_WEBHOOK_URL`:
 * la vía de guardia (SMS, otro turno), no el canal que ya nadie miró.
 */
export async function notifyEscalation(env: Env, summary: string, patientId: string): Promise<void> {
  const target = resolveEscalationTarget(env);
  if (!target) {
    console.error(`Urgencia sin atender y sin webhook configurado: ${summary}`);
    return;
  }

  if (target.isFallback) {
    console.warn(
      "ESCALATION_WEBHOOK_URL sin configurar: el reenvío sale por el mismo canal que ya se ignoró. " +
        "Configurá una vía distinta (SMS, guardia) o el escalado no escala nada.",
    );
  }

  await post(target.url, summary, patientId, "escalation");
}

async function post(url: string, summary: string, patientId: string, kind: NotificationKind): Promise<void> {
  await withRetry(
    async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: summary, patient_id: patientId, kind, source: "serena" }),
      });
      if (!res.ok) throw new HttpError(res.status, `notify(${kind}) ${res.status}: ${await res.text()}`);
    },
    { label: `notify.${kind}`, attempts: 4, baseDelayMs: 300 },
  );
}
