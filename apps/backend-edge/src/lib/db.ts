import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_EXTRACTED_DATA,
  type Database,
  type ExtractedData,
  type MessageType,
  type Patient,
  type UrgencyAlert,
} from "@serena/types";
import type { Env } from "../types";

/**
 * Cliente con service_role: salta RLS a proposito, porque el worker atiende
 * webhooks de Meta y no tiene sesion de usuario. Nunca exponer esta key.
 */
export function serviceClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "serena-backend-edge" } },
  });
}

/** Resuelve el paciente por el numero entrante (E.164 sin '+'). */
export async function findPatientByWhatsapp(
  db: SupabaseClient<Database>,
  whatsappNumber: string,
): Promise<Patient | null> {
  const { data, error } = await db
    .from("patients")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .neq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Supabase findPatient: ${error.message}`);
  return data ?? null;
}

export function currentData(patient: Patient): ExtractedData {
  const raw = patient.extracted_data as Partial<ExtractedData> | null;
  if (!raw || Object.keys(raw).length === 0) return { ...EMPTY_EXTRACTED_DATA };
  return { ...EMPTY_EXTRACTED_DATA, ...raw };
}

export async function savePatientData(
  db: SupabaseClient<Database>,
  patientId: string,
  data: ExtractedData,
  completed: boolean,
): Promise<void> {
  const { error } = await db
    .from("patients")
    .update({
      extracted_data: data,
      status: completed ? "completed" : "in_progress",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", patientId);

  if (error) throw new Error(`Supabase savePatientData: ${error.message}`);
}

/**
 * Reserva un `message.id` antes de procesarlo. Devuelve false si otro intento
 * ya lo tomó: Meta reintenta el webhook y sin esta reserva el mismo audio se
 * transcribe (y se cobra) dos veces, y el paciente recibe la pregunta repetida.
 * La condición de carrera la resuelve la PK, no una lectura previa.
 */
export async function claimMessage(
  db: SupabaseClient<Database>,
  messageId: string,
  patientId: string,
): Promise<boolean> {
  const { error } = await db
    .from("processed_messages")
    .insert({ message_id: messageId, patient_id: patientId });

  if (!error) return true;
  if (error.code === "23505") return false; // unique_violation: ya procesado

  // Ante un fallo distinto se procesa igual: repetir una pregunta molesta menos
  // que perder la respuesta del paciente.
  console.error(`Supabase claimMessage: ${error.message}`);
  return true;
}

/**
 * Guarda la alerta antes de contestarle al paciente: si el envío por WhatsApp
 * falla, la clínica igual tiene el aviso. El orden importa.
 */
export async function insertUrgencyAlert(
  db: SupabaseClient<Database>,
  patient: Pick<Patient, "id" | "clinic_id">,
  motivo: string,
  frasePaciente: string | null,
): Promise<void> {
  const { error } = await db.from("urgency_alerts").insert({
    patient_id: patient.id,
    clinic_id: patient.clinic_id,
    motivo,
    frase_paciente: frasePaciente,
  });

  if (error) throw new Error(`Supabase insertUrgencyAlert: ${error.message}`);
}

/** Alertas sin acusar recibo y sin escalar, de todas las clínicas. */
export async function pendingUnescalatedAlerts(db: SupabaseClient<Database>): Promise<UrgencyAlert[]> {
  const { data, error } = await db
    .from("urgency_alerts")
    .select("*")
    .is("acknowledged_at", null)
    .is("escalated_at", null)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(`Supabase pendingUnescalatedAlerts: ${error.message}`);
  return data ?? [];
}

export async function markEscalated(
  db: SupabaseClient<Database>,
  alertIds: string[],
  now: Date,
): Promise<void> {
  const { error } = await db
    .from("urgency_alerts")
    .update({ escalated_at: now.toISOString() })
    .in("id", alertIds);

  if (error) throw new Error(`Supabase markEscalated: ${error.message}`);
}

export async function patientNames(
  db: SupabaseClient<Database>,
  patientIds: string[],
): Promise<Map<string, string>> {
  const { data } = await db.from("patients").select("id, full_name").in("id", patientIds);
  return new Map((data ?? []).map((p) => [p.id, p.full_name]));
}

export async function logMessage(
  db: SupabaseClient<Database>,
  patientId: string,
  messageType: MessageType,
  transcription: string | null,
  mediaId: string | null = null,
): Promise<void> {
  const { error } = await db
    .from("onboarding_logs")
    .insert({ patient_id: patientId, message_type: messageType, transcription, media_id: mediaId });

  // La auditoria no debe tumbar el turno del paciente: se registra y se sigue.
  if (error) console.error(`Supabase logMessage: ${error.message}`);
}
