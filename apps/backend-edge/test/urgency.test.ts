import { describe, expect, it } from "vitest";
import { buildAlertSummary, buildUrgencyReply } from "../src/lib/urgency";

describe("buildUrgencyReply", () => {
  const reply = buildUrgencyReply("dolor torácico desde ayer");

  it("manda a emergencias antes que nada", () => {
    expect(reply.toLowerCase()).toContain("emergencias");
  });

  it("no le repite el síntoma al paciente: asusta y no ayuda", () => {
    expect(reply).not.toContain("dolor torácico");
  });

  it("le dice que la ficha puede esperar", () => {
    expect(reply).toContain("después");
  });

  it("no depende del motivo para ser un mensaje válido", () => {
    expect(buildUrgencyReply(null)).toBe(reply);
  });
});

describe("buildAlertSummary", () => {
  it("incluye paciente, motivo y la cita textual", () => {
    const summary = buildAlertSummary("Dolores Fernández", "posible dolor torácico", "me duele acá en el pecho");
    expect(summary).toContain("Dolores Fernández");
    expect(summary).toContain("posible dolor torácico");
    expect(summary).toContain('"me duele acá en el pecho"');
  });

  it("funciona sin cita", () => {
    const summary = buildAlertSummary("Ramón Salazar", "caída reciente", null);
    expect(summary).toBe("URGENCIA · Ramón Salazar: caída reciente");
  });
});
