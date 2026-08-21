/**
 * Validacion de la firma `X-Hub-Signature-256` que envia Meta.
 * Sin esto cualquiera puede inyectar mensajes falsos en el onboarding.
 */

const encoder = new TextEncoder();

export async function verifyMetaSignature(
  rawBody: string,
  header: string | undefined | null,
  appSecret: string,
): Promise<boolean> {
  if (!header || !header.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const received = header.slice("sha256=".length);

  return timingSafeEqual(expected, received);
}

/** Comparacion en tiempo constante: evita filtrar la firma byte a byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
