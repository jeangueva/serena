import type { Env } from "../types";
import { HttpError, withRetry } from "./retry";

/** Cliente minimo de la WhatsApp Cloud API (Graph). */
export class MetaClient {
  constructor(private readonly env: Env) {}

  private get base(): string {
    return `https://graph.facebook.com/${this.env.WHATSAPP_GRAPH_VERSION}`;
  }

  private get authHeader(): Record<string, string> {
    return { Authorization: `Bearer ${this.env.WHATSAPP_TOKEN}` };
  }

  /** Descarga una nota de voz: primero la URL firmada, luego los bytes. */
  async downloadMedia(mediaId: string): Promise<{ blob: Blob; mimeType: string }> {
    const meta = await withRetry(
      async () => {
        const res = await fetch(`${this.base}/${mediaId}`, { headers: this.authHeader });
        if (!res.ok) throw new HttpError(res.status, `Meta media lookup ${res.status}: ${await res.text()}`);
        return (await res.json()) as { url: string; mime_type: string };
      },
      { label: "meta.downloadMedia.lookup" },
    );

    // La URL de descarga tambien exige el bearer token.
    const blob = await withRetry(
      async () => {
        const res = await fetch(meta.url, { headers: this.authHeader });
        if (!res.ok) throw new HttpError(res.status, `Meta media download ${res.status}: ${await res.text()}`);
        return await res.blob();
      },
      { label: "meta.downloadMedia.fetch" },
    );

    return { blob, mimeType: meta.mime_type };
  }

  /** Envia un mensaje de texto libre. Solo válido dentro de la ventana de 24 h. */
  async sendText(to: string, body: string): Promise<void> {
    await this.post({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body },
    }, "meta.sendText");
  }

  /**
   * Envia la plantilla aprobada por Meta.
   * Fuera de la ventana de 24 h es la unica forma de escribir primero: un texto
   * libre a un paciente que nunca contesto se rechaza con error 131047.
   * `params` rellena las variables {{1}}, {{2}}... del cuerpo de la plantilla.
   */
  async sendTemplate(to: string, templateName: string, language: string, params: string[]): Promise<void> {
    await this.post({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        ...(params.length > 0
          ? { components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] }
          : {}),
      },
    }, "meta.sendTemplate");
  }

  /** Marca el mensaje como leido: el paciente ve el doble check azul y espera tranquilo. */
  async markAsRead(messageId: string): Promise<void> {
    await fetch(`${this.base}/${this.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { ...this.authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: messageId }),
    }).catch(() => undefined); // best-effort, nunca debe romper el pipeline
  }

  private async post(payload: unknown, label: string): Promise<void> {
    await withRetry(async () => {
      const res = await fetch(`${this.base}/${this.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: { ...this.authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new HttpError(res.status, `${label} ${res.status}: ${await res.text()}`);
    }, { label });
  }
}
