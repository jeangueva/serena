import { Hono } from "hono";
import type { Env, WhatsAppWebhookBody } from "../types";
import { verifyMetaSignature } from "../lib/signature";
import { handleIncomingMessage } from "../lib/pipeline";

export const whatsapp = new Hono<{ Bindings: Env }>();

/** Handshake de verificacion del webhook (Meta lo llama una sola vez). */
whatsapp.get("/webhook/whatsapp", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode === "subscribe" && token === c.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return c.text(challenge, 200);
  }
  return c.text("Forbidden", 403);
});

/**
 * Webhook de mensajes entrantes.
 * Meta corta a los ~5 s y reintenta, asi que se responde 200 de inmediato y
 * el trabajo pesado (descarga + Whisper + Claude) corre en `waitUntil`.
 */
whatsapp.post("/webhook/whatsapp", async (c) => {
  const rawBody = await c.req.text();

  const valid = await verifyMetaSignature(
    rawBody,
    c.req.header("x-hub-signature-256"),
    c.env.WHATSAPP_APP_SECRET,
  );
  if (!valid) return c.text("Invalid signature", 401);

  let body: WhatsAppWebhookBody;
  try {
    body = JSON.parse(rawBody) as WhatsAppWebhookBody;
  } catch {
    return c.text("Bad request", 400);
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue; // statuses (delivered/read): se ignoran

      const contactName = value.contacts?.[0]?.profile?.name ?? null;
      for (const message of value.messages) {
        c.executionCtx.waitUntil(
          handleIncomingMessage(c.env, message, contactName).catch((err: unknown) =>
            console.error("handleIncomingMessage:", err),
          ),
        );
      }
    }
  }

  return c.text("EVENT_RECEIVED", 200);
});
