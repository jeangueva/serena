import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./types";
import { whatsapp } from "./routes/whatsapp";
import { patients } from "./routes/patients";

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

export default app;
