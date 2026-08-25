import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./types";
import { whatsapp } from "./routes/whatsapp";
import { patients } from "./routes/patients";
import { runEscalationSweep } from "./lib/escalation";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
// Solo la API interna necesita CORS; el webhook lo llama Meta server-to-server.
app.use("/api/*", cors({ origin: (origin) => origin, allowHeaders: ["authorization", "content-type"] }));

app.get("/", (c) => c.json({ service: "serena-backend-edge", status: "ok" }));
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.route("/", whatsapp);
app.route("/", patients);

app.onError((err, c) => {
  console.error("Unhandled:", err);
  return c.json({ error: "internal_error" }, 500);
});

export default {
  fetch: app.fetch,

  /**
   * Cron (ver `[triggers]` en wrangler.toml): reenvía las urgencias que nadie
   * acusó recibo. Sin esto una alerta espera en el panel indefinidamente, que
   * es exactamente lo que falla de madrugada.
   */
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runEscalationSweep(env)
        .then((n) => n > 0 && console.warn(`Escaladas ${n} alertas de urgencia sin atender.`))
        .catch((err: unknown) => console.error("runEscalationSweep:", err)),
    );
  },
} satisfies ExportedHandler<Env>;
