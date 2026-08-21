import type { ExtractedData } from "./extracted-data";

/**
 * Guion del onboarding. Serena avanza campo por campo: una sola pregunta por
 * mensaje, porque preguntar dos cosas a la vez confunde al paciente mayor.
 */
export interface OnboardingStep {
  key: keyof ExtractedData;
  label: string;
  question: string;
  /** Un campo se considera respondido cuando esta funcion devuelve true. */
  isAnswered: (data: ExtractedData) => boolean;
}

const hasText = (v: string | null): boolean => typeof v === "string" && v.trim().length > 0;

/** Una lista cuenta como respondida si trae elementos o si el paciente la nego. */
const listAnswered = (items: unknown[], key: string, data: ExtractedData): boolean =>
  items.length > 0 || data.confirmaciones_negativas.includes(key);

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "documento_identidad",
    label: "Documento de identidad",
    question:
      "Para empezar, ¿me dice su número de documento? Dígalo despacio, número por número. No hay apuro.",
    isAnswered: (d) => hasText(d.documento_identidad),
  },
  {
    key: "fecha_nacimiento",
    label: "Fecha de nacimiento",
    question: "Muchas gracias. Ahora, ¿qué día, mes y año nació?",
    isAnswered: (d) => hasText(d.fecha_nacimiento),
  },
  {
    key: "alergias",
    label: "Alergias",
    question:
      "Perfecto. ¿Es alérgico o alérgica a algún medicamento o a alguna comida? Si no lo es, dígame simplemente “no tengo alergias”.",
    isAnswered: (d) => listAnswered(d.alergias, "alergias", d),
  },
  {
    key: "medicamentos",
    label: "Medicamentos",
    question:
      "¿Qué medicamentos toma actualmente? Nómbrelos uno por uno, y si recuerda la dosis, mejor. Tómese su tiempo.",
    isAnswered: (d) => listAnswered(d.medicamentos, "medicamentos", d),
  },
  {
    key: "condiciones_cronicas",
    label: "Condiciones crónicas",
    question:
      "¿Tiene alguna condición de salud tratada desde hace tiempo? Por ejemplo presión alta, diabetes o algo del corazón.",
    isAnswered: (d) => listAnswered(d.condiciones_cronicas, "condiciones_cronicas", d),
  },
  {
    key: "cobertura_medica",
    label: "Cobertura médica",
    question: "¿Con qué obra social, prepaga o seguro médico se atiende?",
    isAnswered: (d) => hasText(d.cobertura_medica),
  },
  {
    key: "contacto_emergencia",
    label: "Contacto de emergencia",
    question:
      "Ya casi terminamos. ¿A quién llamamos si necesitamos avisar de algo? Dígame el nombre, qué es suyo y su teléfono.",
    isAnswered: (d) => hasText(d.contacto_emergencia.nombre) && hasText(d.contacto_emergencia.telefono),
  },
  {
    key: "movilidad",
    label: "Movilidad",
    question:
      "Última pregunta: ¿camina usted sin ayuda, o usa bastón, andador o silla de ruedas?",
    isAnswered: (d) => hasText(d.movilidad),
  },
];

/** Devuelve el primer paso sin responder, o null si el onboarding esta completo. */
export function nextPendingStep(data: ExtractedData): OnboardingStep | null {
  return ONBOARDING_STEPS.find((step) => !step.isAnswered(data)) ?? null;
}

/** Porcentaje 0-100 de avance del onboarding. Se usa en el dashboard. */
export function onboardingProgress(data: ExtractedData): number {
  const done = ONBOARDING_STEPS.filter((step) => step.isAnswered(data)).length;
  return Math.round((done / ONBOARDING_STEPS.length) * 100);
}
