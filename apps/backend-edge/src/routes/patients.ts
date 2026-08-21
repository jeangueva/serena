import { Hono } from "hono";
import type { Env } from "../types";
import { currentData, serviceClient } from "../lib/db";
import { startOnboarding } from "../lib/pipeline";

export const patients = new Hono<{ Bindings: Env }>();

/**
 * Dispara el onboarding de un paciente (lo llama el dashboard).
 * Autenticacion: el JWT de Supabase del usuario logueado. Se comprueba ademas
 * que ese usuario pertenezca a la clinica dueña del paciente: el worker usa
 * service_role, asi que RLS no protege esta ruta y el chequeo va explicito.
 */
patients.post("/api/patients/:id/start-onboarding", async (c) => {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.json({ error: "unauthorized" }, 401);

  const userId = await resolveUserId(c.env, authHeader.slice(7));
  if (!userId) return c.json({ error: "unauthorized" }, 401);

  const db = serviceClient(c.env);
  const { data: patient, error } = await db
    .from("patients")
    .select("*")
    .eq("id", c.req.param("id"))
    .maybeSingle();

  if (error) return c.json({ error: error.message }, 500);
  if (!patient) return c.json({ error: "not_found" }, 404);

  const { data: membership } = await db
    .from("clinic_members")
    .select("user_id")
    .eq("clinic_id", patient.clinic_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return c.json({ error: "forbidden" }, 403);

  await startOnboarding(c.env, patient.id, patient.whatsapp_number, patient.full_name, currentData(patient));
  return c.json({ ok: true, patient_id: patient.id });
});

/** Valida el JWT contra Supabase Auth y devuelve el user id. */
async function resolveUserId(env: Env, token: string): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}
