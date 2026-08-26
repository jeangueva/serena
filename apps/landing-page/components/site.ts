export const SOURCE_URL = process.env.NEXT_PUBLIC_SOURCE_URL ?? "https://github.com/jeangueva/serena";

export const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173";

export const PLANS = [
  {
    name: "Consultorio",
    price: "49",
    tagline: "Para consultorios que reciben hasta 50 pacientes nuevos al mes.",
    features: ["50 onboardings al mes", "1 número de WhatsApp", "Panel con 2 usuarios", "Soporte por email"],
    featured: false,
  },
  {
    name: "Clínica",
    price: "149",
    tagline: "El plan que usan la mayoría de las clínicas con recepción propia.",
    features: [
      "300 onboardings al mes",
      "Usuarios ilimitados en el panel",
      "Campos clínicos personalizados",
      "Exportación a tu historia clínica (próximamente)",
      "Soporte prioritario",
    ],
    featured: true,
  },
  {
    name: "Red",
    price: "A medida",
    tagline: "Varias sedes, integración con tu HIS y acuerdos de nivel de servicio.",
    features: ["Volumen ilimitado", "Multi-sede con datos separados", "Integración HL7 / FHIR (próximamente)", "Onboarding asistido"],
    featured: false,
  },
] as const;

export const FAQS = [
  {
    q: "¿El paciente tiene que instalar algo?",
    a: "No. Recibe un WhatsApp de la clínica y contesta con notas de voz, igual que le habla a un hijo o a una nieta. No hay app, ni link, ni contraseña, ni formulario que llenar.",
  },
  {
    q: "¿Y si el paciente habla lento, se corta o se va por las ramas?",
    a: "Serena está diseñada para eso. Repite la pregunta con otras palabras, nunca apura y jamás le dice al paciente que se equivocó. Si un audio no se entiende, vuelve a preguntar con calma.",
  },
  {
    q: "¿Qué datos extrae exactamente?",
    a: "Documento, fecha de nacimiento, alergias, medicación con dosis y frecuencia, condiciones crónicas, cirugías previas, cobertura médica, contacto de emergencia y movilidad. Los campos se pueden ajustar por clínica.",
  },
  {
    q: "¿Dónde quedan guardados los datos?",
    a: "En una base con aislamiento por clínica: cada organización solo alcanza sus propias filas, a nivel de base de datos, no solo de interfaz. Los audios no se almacenan una vez transcritos.",
  },
  {
    q: "¿Reemplaza al personal de recepción?",
    a: "No. Le devuelve el tiempo. La recepción deja de transcribir a mano lo que el paciente dictó por teléfono y pasa a revisar una ficha ya armada.",
  },
  {
    q: "¿Cuánto tarda la puesta en marcha?",
    a: "Una tarde. Conectás el número de WhatsApp de la clínica, cargás tus pacientes y Serena empieza a escribirles.",
  },
] as const;
