import { describe, expect, it } from "vitest";
import { whatsapp } from "../src/routes/whatsapp";

const SECRET = "token-de-verificacion";
const env = { WHATSAPP_VERIFY_TOKEN: SECRET } as Record<string, unknown>;

const get = (qs: string, environment: Record<string, unknown> = env) =>
  whatsapp.request(`/webhook/whatsapp?${qs}`, {}, environment);

describe("handshake de verificación", () => {
  it("devuelve el challenge con el token correcto", async () => {
    const res = await get(`hub.mode=subscribe&hub.verify_token=${SECRET}&hub.challenge=1234`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("1234");
  });

  it("rechaza un token equivocado", async () => {
    const res = await get("hub.mode=subscribe&hub.verify_token=otro&hub.challenge=1234");
    expect(res.status).toBe(403);
  });

  it("rechaza el handshake sin token", async () => {
    const res = await get("hub.mode=subscribe&hub.challenge=1234");
    expect(res.status).toBe(403);
  });

  // El caso que abre el secreto: si no está configurado, un handshake sin
  // token compararía undefined con undefined y pasaría.
  it("falla cerrado cuando el secreto no está configurado", async () => {
    const res = await get("hub.mode=subscribe&hub.challenge=1234", {});
    expect(res.status).toBe(500);
    expect(await res.text()).not.toBe("1234");
  });
});
