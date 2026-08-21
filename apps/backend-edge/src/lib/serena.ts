import Anthropic from "@anthropic-ai/sdk";
import {
  EMPTY_EXTRACTED_DATA,
  EXTRACTED_DATA_JSON_SCHEMA,
  type ExtractedData,
} from "@serena/types";
import type { Env } from "../types";

/**
 * La personalidad de Serena. Es estricta a proposito: el paciente es un adulto
 * mayor que puede estar nervioso, y cualquier deriva de tono destruye la
 * confianza que hace que conteste la siguiente pregunta.
 */
export const SERENA_SYSTEM_PROMPT = `Eres Serena, una asistente clínica empática y ultra-paciente que acompaña a personas mayores durante el registro en una clínica, por WhatsApp.

QUIÉN TE ESCUCHA
- Personas mayores, muchas veces solas, a veces con audición o memoria reducida.
- Responden con notas de voz. La transcripción que recibes puede venir cortada, con ruido o con palabras mal reconocidas.

TU FORMA DE HABLAR
- Español neutro, tratando de "usted", cálido y sin prisa.
- Frases cortas. Una sola idea por frase. Nada de tecnicismos.
- Nunca apures, nunca regañes, nunca digas que algo está mal. Si algo no se entendió, la culpa es del audio, jamás del paciente.
- Máximo dos frases en el acuse de recibo. Estás en WhatsApp, no escribiendo una carta.
- Sin emojis salvo uno ocasional y sobrio. Sin mayúsculas sostenidas.

TU TRABAJO CON LOS DATOS
- Extraes información clínica de lo que dijo el paciente y la fusionas con lo que ya se sabía.
- NUNCA borres ni sobrescribas un dato ya registrado salvo que el paciente lo corrija explícitamente.
- No inventes. Si un dato no fue dicho con claridad, déjalo en null y no lo des por bueno.
- Los números de documento y teléfono se dictan dígito a dígito: reconstruye la cadena sin espacios ni puntos.
- Si el paciente niega algo ("no tomo ningún remedio", "no soy alérgica a nada"), registra esa clave en confirmaciones_negativas. No es lo mismo "no preguntado" que "no tiene".
- Si el audio es ininteligible o el paciente habla de otra cosa, marca requiere_repeticion en true y no inventes datos.

NUNCA
- Nunca des consejo médico, diagnóstico ni opinión sobre un tratamiento.
- Nunca pidas datos bancarios, contraseñas ni claves.
- Si el paciente describe una urgencia (dolor en el pecho, caída, falta de aire), no sigas el cuestionario: dile con calma que llame de inmediato a emergencias y que la clínica será avisada.`;

const TURN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["datos", "acuse", "requiere_repeticion"],
  properties: {
    datos: EXTRACTED_DATA_JSON_SCHEMA,
    acuse: {
      type: "string",
      description:
        "Acuse de recibo cálido para el paciente, máximo dos frases. No incluye la siguiente pregunta.",
    },
    requiere_repeticion: {
      type: "boolean",
      description: "true si el audio no se entendió y hay que repetir la misma pregunta.",
    },
  },
} as const;

export interface SerenaTurn {
  datos: ExtractedData;
  acuse: string;
  requiere_repeticion: boolean;
}

export interface InterpretParams {
  patientName: string;
  currentData: ExtractedData;
  transcription: string;
  /** Etiqueta del campo que Serena acababa de preguntar, si habia alguno. */
  pendingLabel: string | null;
}

/**
 * Una sola llamada al modelo por turno: extrae + fusiona + redacta el acuse.
 * La pregunta siguiente NO la decide el modelo (ver `composeReply`), asi el
 * cuestionario siempre avanza aunque el modelo divague.
 */
export async function interpretTurn(env: Env, params: InterpretParams): Promise<SerenaTurn> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const userContent = [
    `Paciente: ${params.patientName}`,
    params.pendingLabel ? `Pregunta que se le acababa de hacer: ${params.pendingLabel}` : "Primer mensaje del paciente.",
    "",
    "Datos ya registrados (JSON):",
    JSON.stringify(params.currentData),
    "",
    "Transcripción de la nota de voz que acaba de enviar:",
    `"""${params.transcription}"""`,
    "",
    "Devuelve el objeto completo de datos ya fusionado, más un acuse de recibo breve.",
  ].join("\n");

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 4096,
    system: [
      // Prefijo estable -> se cachea entre turnos y entre pacientes.
      { type: "text", text: SERENA_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: TURN_SCHEMA },
    },
    messages: [{ role: "user", content: userContent }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazó la solicitud (stop_reason: refusal).");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const parsed = JSON.parse(text) as Partial<SerenaTurn>;

  return {
    datos: normalizeData(parsed.datos),
    acuse: (parsed.acuse ?? "Gracias, ya lo anoté.").trim(),
    requiere_repeticion: parsed.requiere_repeticion === true,
  };
}

/** Blinda la respuesta del modelo: nunca dejar el jsonb a medio formar. */
function normalizeData(data: Partial<ExtractedData> | undefined): ExtractedData {
  const d = data ?? {};
  return {
    ...EMPTY_EXTRACTED_DATA,
    ...d,
    alergias: Array.isArray(d.alergias) ? d.alergias : [],
    medicamentos: Array.isArray(d.medicamentos) ? d.medicamentos : [],
    condiciones_cronicas: Array.isArray(d.condiciones_cronicas) ? d.condiciones_cronicas : [],
    cirugias_previas: Array.isArray(d.cirugias_previas) ? d.cirugias_previas : [],
    confirmaciones_negativas: Array.isArray(d.confirmaciones_negativas) ? d.confirmaciones_negativas : [],
    contacto_emergencia: {
      nombre: d.contacto_emergencia?.nombre ?? null,
      telefono: d.contacto_emergencia?.telefono ?? null,
      relacion: d.contacto_emergencia?.relacion ?? null,
    },
  };
}
