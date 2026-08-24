/**
 * Mensaje que recibe el paciente cuando Serena detecta una urgencia.
 * Aislado y puro para poder probarlo: es el texto que alguien va a leer en el
 * peor momento posible, y no puede depender de que el modelo esté inspirado.
 */
export function buildUrgencyReply(motivo: string | null): string {
  const cuerpo = [
    "Escuche bien, esto es importante y no puede esperar.",
    "",
    "Por favor llame ahora mismo al número de emergencias, o pídale a alguien cerca que lo haga por usted.",
    "",
    "Yo aviso a la clínica en este momento. Las preguntas de la ficha quedan para después: ahora lo único que importa es que lo atiendan.",
  ].join("\n");

  // El motivo no se le repite al paciente: nombrarle el síntoma no ayuda y
  // puede asustarlo más. Va al registro de la clínica, no al mensaje.
  void motivo;
  return cuerpo;
}

/** Texto corto para el webhook y el banner del panel. */
export function buildAlertSummary(patientName: string, motivo: string, frase: string | null): string {
  const base = `URGENCIA · ${patientName}: ${motivo}`;
  return frase ? `${base} — dijo: "${frase}"` : base;
}
