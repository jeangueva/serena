import { supabase } from "./supabase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787";

/** Le pide al worker que mande el primer WhatsApp del onboarding. */
export async function startOnboarding(patientId: string): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sesión expirada.");

  const res = await fetch(`${BACKEND_URL}/api/patients/${patientId}/start-onboarding`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `No se pudo iniciar el onboarding (${res.status}).`);
  }
}
