export interface Env {
  // vars (wrangler.toml)
  SUPABASE_URL: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_GRAPH_VERSION: string;
  /** Plantilla aprobada por Meta para abrir conversación fuera de las 24 h. */
  WHATSAPP_TEMPLATE_NAME: string;
  WHATSAPP_TEMPLATE_LANG: string;
  ANTHROPIC_MODEL: string;
  TRANSCRIPTION_MODEL: string;
  /** Minutos sin acuse de recibo antes de reenviar el aviso de urgencia. */
  ESCALATION_MINUTES: string;
  // secrets (wrangler secret put / .dev.vars)
  SUPABASE_SERVICE_ROLE_KEY: string;
  WHATSAPP_TOKEN: string;
  WHATSAPP_APP_SECRET: string;
  WHATSAPP_VERIFY_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  /** Opcional: URL que recibe el aviso de urgencia (Slack, guardia, etc.). */
  ALERT_WEBHOOK_URL: string;
}

/** Subconjunto del payload de webhook de WhatsApp Cloud API que usamos. */
export interface WhatsAppWebhookBody {
  object?: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: WhatsAppIncomingMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
}

export interface WhatsAppIncomingMessage {
  id: string;
  from: string;
  timestamp: string;
  type: "audio" | "voice" | "text" | "image" | "document" | string;
  audio?: { id: string; mime_type: string; voice?: boolean };
  text?: { body: string };
}
