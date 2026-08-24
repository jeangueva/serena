import { nextPendingStep, type ExtractedData } from "@serena/types";
import type { Env, WhatsAppIncomingMessage } from "../types";
import {
  claimMessage,
  currentData,
  findPatientByWhatsapp,
  insertUrgencyAlert,
  logMessage,
  savePatientData,
  serviceClient,
} from "./db";
import { notifyUrgency } from "./notify";
import { buildAlertSummary, buildUrgencyReply } from "./urgency";
import { MetaClient } from "./meta";
import { interpretTurn } from "./serena";
import { transcribeAudio } from "./transcription";

const SALUDO_INICIAL =
  "Hola, soy Serena, la asistente de la clínica. Le voy a hacer unas pocas preguntas para completar su ficha. " +
  "Puede contestarme con notas de voz, hablando despacio y con toda la calma. Si algo no se entiende, se lo vuelvo a preguntar sin problema.";

const CIERRE =
  "Listo, ya tengo todo lo que necesitaba. Muchas gracias por su paciencia. " +
  "La clínica ya tiene su ficha completa y no hace falta que haga nada más.";

const SOLO_AUDIO =
  "Gracias por escribir. Si le resulta más cómodo, puede contestarme con una nota de voz: " +
  "mantenga apretado el micrófono y hable con calma. También puedo leer lo que escriba.";

const ERROR_AMABLE =
  "Perdón, tuve un problema para escuchar su mensaje. ¿Me lo puede volver a enviar en unos minutos? Gracias por la paciencia.";

/**
 * Procesa un mensaje entrante de punta a punta.
 * Se ejecuta dentro de `ctx.waitUntil`: el webhook ya respondio 200 a Meta.
 */
export async function handleIncomingMessage(
  env: Env,
  message: WhatsAppIncomingMessage,
  contactName: string | null,
): Promise<void> {
  const db = serviceClient(env);
  const meta = new MetaClient(env);

  const patient = await findPatientByWhatsapp(db, message.from);
  if (!patient) {
    // Numero desconocido: no hay onboarding activo. No se contesta nada para
    // no filtrar informacion ni gastar la ventana de 24h de la conversacion.
    console.warn(`Mensaje de numero sin paciente activo: ${message.from}`);
    return;
  }

  // Idempotencia antes que nada: Meta reintenta el webhook.
  if (!(await claimMessage(db, message.id, patient.id))) {
    console.info(`Mensaje ${message.id} ya procesado, se ignora el reintento.`);
    return;
  }

  await meta.markAsRead(message.id);

  try {
    const isAudio = message.type === "audio" || message.type === "voice";
    const isText = message.type === "text" && Boolean(message.text?.body);

    if (!isAudio && !isText) {
      await reply(env, db, meta, patient.id, message.from, SOLO_AUDIO);
      return;
    }

    // 1. Obtener el texto del paciente (transcripcion o texto plano).
    let transcription: string;
    if (isAudio && message.audio) {
      const { blob, mimeType } = await meta.downloadMedia(message.audio.id);
      transcription = await transcribeAudio(env, blob, mimeType);
      await logMessage(db, patient.id, "audio_in", transcription, message.audio.id);
    } else {
      transcription = message.text?.body ?? "";
      await logMessage(db, patient.id, "text_in", transcription, null);
    }

    if (!transcription) {
      await reply(env, db, meta, patient.id, message.from, ERROR_AMABLE);
      return;
    }

    // 2. Extraer y fusionar datos con la personalidad de Serena.
    const data = currentData(patient);
    const pending = nextPendingStep(data);
    const turn = await interpretTurn(env, {
      patientName: patient.full_name || contactName || "el paciente",
      currentData: data,
      transcription,
      pendingLabel: pending?.label ?? null,
    });

    // 3. Urgencia: corta el cuestionario. Se guarda la alerta y los datos que
    // ya se habían extraído, pero no se avanza de paso ni se cierra la ficha.
    if (turn.alerta_urgencia.detectada) {
      const motivo = turn.alerta_urgencia.motivo ?? "El paciente describió una posible urgencia.";
      await savePatientData(db, patient.id, turn.datos, false);
      await insertUrgencyAlert(db, patient, motivo, turn.alerta_urgencia.frase_paciente);

      const resumen = buildAlertSummary(patient.full_name, motivo, turn.alerta_urgencia.frase_paciente);
      // El aviso externo no puede bloquear la respuesta al paciente, pero su
      // fallo tampoco puede pasar en silencio.
      await notifyUrgency(env, resumen, patient.id).catch((err: unknown) =>
        console.error("notifyUrgency falló, la alerta queda solo en el panel:", err),
      );

      await reply(env, db, meta, patient.id, message.from, buildUrgencyReply(motivo));
      return;
    }

    // 4. Persistir. El estado se deriva del guion, no de la opinion del modelo.
    const nextStep = turn.requiere_repeticion ? pending : nextPendingStep(turn.datos);
    const completed = nextStep === null;
    await savePatientData(db, patient.id, turn.datos, completed);

    // 5. Contestar: acuse del modelo + siguiente pregunta deterministica.
    // El saludo solo en el primer turno: la plantilla ya rompió el hielo, aquí
    // recién se abre la ventana de 24 h y Serena puede escribir texto libre.
    const cuerpo = composeReply(turn.acuse, turn.requiere_repeticion, nextStep);
    const esPrimerTurno = patient.status === "pending_onboarding";
    await reply(
      env,
      db,
      meta,
      patient.id,
      message.from,
      esPrimerTurno ? `${SALUDO_INICIAL}\n\n${cuerpo}` : cuerpo,
    );
  } catch (err) {
    console.error("Pipeline error:", err);
    await reply(env, db, meta, patient.id, message.from, ERROR_AMABLE).catch(() => undefined);
  }
}

/**
 * Invita al paciente al onboarding.
 * La clínica escribe primero, así que fuera de la ventana de 24 h Meta solo
 * acepta una plantilla aprobada; el texto libre se rechaza con el error 131047.
 * La conversación se abre recién cuando el paciente contesta, y ahí el pipeline
 * manda el saludo y la primera pregunta.
 */
export async function startOnboarding(
  env: Env,
  patientId: string,
  whatsappNumber: string,
  patientName: string,
  data: ExtractedData,
): Promise<void> {
  const db = serviceClient(env);
  const meta = new MetaClient(env);

  if (nextPendingStep(data) === null) {
    await reply(env, db, meta, patientId, whatsappNumber, CIERRE);
    return;
  }

  const primerNombre = patientName.trim().split(/\s+/)[0] ?? "";

  try {
    await meta.sendTemplate(whatsappNumber, env.WHATSAPP_TEMPLATE_NAME, env.WHATSAPP_TEMPLATE_LANG, [primerNombre]);
    await logMessage(db, patientId, "text_out", `[plantilla ${env.WHATSAPP_TEMPLATE_NAME}] ${primerNombre}`, null);
  } catch (err) {
    // En desarrollo no hay plantilla aprobada todavía. Si el paciente ya
    // escribió, la ventana está abierta y el texto libre sí pasa.
    console.warn("Plantilla rechazada, se intenta texto libre:", err);
    await reply(env, db, meta, patientId, whatsappNumber, SALUDO_INICIAL);
  }
}

function composeReply(
  acuse: string,
  requiereRepeticion: boolean,
  nextStep: { question: string } | null,
): string {
  if (!nextStep) return `${acuse}\n\n${CIERRE}`;
  if (requiereRepeticion) {
    return "Perdón, se escuchó entrecortado y no quiero anotar algo equivocado. Se lo pregunto otra vez, con toda la calma:\n\n" +
      nextStep.question;
  }
  return `${acuse}\n\n${nextStep.question}`;
}

async function reply(
  env: Env,
  db: ReturnType<typeof serviceClient>,
  meta: MetaClient,
  patientId: string,
  to: string,
  body: string,
): Promise<void> {
  await meta.sendText(to, body);
  await logMessage(db, patientId, "text_out", body, null);
}
