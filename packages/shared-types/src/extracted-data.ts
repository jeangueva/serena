/**
 * Estructura del campo `patients.extracted_data` (jsonb).
 * Es el contrato entre el motor de IA (backend-edge) y el dashboard B2B.
 * Todo campo puede ser null: el paciente puede no haberlo dicho todavia.
 */

export interface Medication {
  nombre: string;
  dosis: string | null;
  frecuencia: string | null;
}

export interface EmergencyContact {
  nombre: string | null;
  telefono: string | null;
  relacion: string | null;
}

export interface ExtractedData {
  documento_identidad: string | null;
  fecha_nacimiento: string | null; // ISO 8601 (YYYY-MM-DD) cuando se puede inferir
  alergias: string[];
  medicamentos: Medication[];
  condiciones_cronicas: string[];
  cirugias_previas: string[];
  contacto_emergencia: EmergencyContact;
  cobertura_medica: string | null; // obra social / seguro / prepaga
  movilidad: string | null; // "camina sin ayuda", "usa baston", "silla de ruedas"...
  notas_adicionales: string | null;
  /**
   * Campos que el paciente nego explicitamente ("no tomo nada", "no soy alergica").
   * Sin esto una lista vacia es ambigua: no se sabe si falta preguntar o si la
   * respuesta fue "ninguno". Valores validos: claves de ExtractedData.
   */
  confirmaciones_negativas: string[];
}

export const EMPTY_EXTRACTED_DATA: ExtractedData = {
  documento_identidad: null,
  fecha_nacimiento: null,
  alergias: [],
  medicamentos: [],
  condiciones_cronicas: [],
  cirugias_previas: [],
  contacto_emergencia: { nombre: null, telefono: null, relacion: null },
  cobertura_medica: null,
  movilidad: null,
  notas_adicionales: null,
  confirmaciones_negativas: [],
};

/**
 * JSON Schema que se pasa a la API de Claude en `output_config.format`.
 * Debe mantenerse sincronizado a mano con la interfaz `ExtractedData`.
 */
export const EXTRACTED_DATA_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "documento_identidad",
    "fecha_nacimiento",
    "alergias",
    "medicamentos",
    "condiciones_cronicas",
    "cirugias_previas",
    "contacto_emergencia",
    "cobertura_medica",
    "movilidad",
    "notas_adicionales",
    "confirmaciones_negativas",
  ],
  properties: {
    documento_identidad: {
      type: ["string", "null"],
      description: "DNI / documento tal como lo dicta el paciente, solo digitos y letras.",
    },
    fecha_nacimiento: {
      type: ["string", "null"],
      description: "Fecha de nacimiento en formato YYYY-MM-DD. null si no es deducible con certeza.",
    },
    alergias: {
      type: "array",
      items: { type: "string" },
      description: "Alergias mencionadas. Lista vacia si el paciente dice que no tiene.",
    },
    medicamentos: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["nombre", "dosis", "frecuencia"],
        properties: {
          nombre: { type: "string" },
          dosis: { type: ["string", "null"], description: "Ej: '10 mg'." },
          frecuencia: { type: ["string", "null"], description: "Ej: 'una vez al dia', 'cada 8 horas'." },
        },
      },
    },
    condiciones_cronicas: { type: "array", items: { type: "string" } },
    cirugias_previas: { type: "array", items: { type: "string" } },
    contacto_emergencia: {
      type: "object",
      additionalProperties: false,
      required: ["nombre", "telefono", "relacion"],
      properties: {
        nombre: { type: ["string", "null"] },
        telefono: { type: ["string", "null"] },
        relacion: { type: ["string", "null"], description: "Ej: 'hija', 'vecino', 'esposo'." },
      },
    },
    cobertura_medica: { type: ["string", "null"], description: "Obra social, prepaga o seguro." },
    movilidad: { type: ["string", "null"] },
    notas_adicionales: {
      type: ["string", "null"],
      description: "Cualquier dato clinico relevante que no encaje en los campos anteriores.",
    },
    confirmaciones_negativas: {
      type: "array",
      items: {
        type: "string",
        enum: ["alergias", "medicamentos", "condiciones_cronicas", "cirugias_previas"],
      },
      description:
        "Claves que el paciente nego de forma explicita. Ej: dice 'no tomo ningun remedio' -> incluir 'medicamentos'.",
    },
  },
} as const;
