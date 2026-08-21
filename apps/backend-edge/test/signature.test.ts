import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "../src/lib/signature";

const SECRET = "app-secret-de-prueba";
const BODY = '{"object":"whatsapp_business_account"}';

async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return "sha256=" + [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

describe("verifyMetaSignature", () => {
  it("acepta una firma valida", async () => {
    expect(await verifyMetaSignature(BODY, await sign(BODY, SECRET), SECRET)).toBe(true);
  });

  it("rechaza un cuerpo alterado", async () => {
    const header = await sign(BODY, SECRET);
    expect(await verifyMetaSignature(BODY + " ", header, SECRET)).toBe(false);
  });

  it("rechaza otro secreto", async () => {
    expect(await verifyMetaSignature(BODY, await sign(BODY, "otro"), SECRET)).toBe(false);
  });

  it("rechaza cabecera ausente o con formato invalido", async () => {
    expect(await verifyMetaSignature(BODY, undefined, SECRET)).toBe(false);
    expect(await verifyMetaSignature(BODY, "abc", SECRET)).toBe(false);
  });
});
