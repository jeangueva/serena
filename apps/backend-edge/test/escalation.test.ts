import { describe, expect, it } from "vitest";
import { buildEscalationSummary, isOverdue, minutesSince } from "../src/lib/escalation";
import { resolveEscalationTarget } from "../src/lib/notify";

const AHORA = new Date("2026-08-24T12:00:00Z");
const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000).toISOString();

const alerta = (patch: Partial<Parameters<typeof isOverdue>[0]> = {}) => ({
  created_at: hace(30),
  acknowledged_at: null,
  escalated_at: null,
  ...patch,
});

describe("isOverdue", () => {
  it("escala una alerta vieja sin atender", () => {
    expect(isOverdue(alerta(), AHORA, 10)).toBe(true);
  });

  it("no escala una alerta recién creada", () => {
    expect(isOverdue(alerta({ created_at: hace(3) }), AHORA, 10)).toBe(false);
  });

  it("no escala si ya la atendieron", () => {
    expect(isOverdue(alerta({ acknowledged_at: hace(1) }), AHORA, 10)).toBe(false);
  });

  it("no escala dos veces la misma alerta", () => {
    expect(isOverdue(alerta({ escalated_at: hace(5) }), AHORA, 10)).toBe(false);
  });

  it("escala justo al cumplirse el umbral, no un minuto después", () => {
    expect(isOverdue(alerta({ created_at: hace(10) }), AHORA, 10)).toBe(true);
    expect(isOverdue(alerta({ created_at: hace(9) }), AHORA, 10)).toBe(false);
  });
});

describe("buildEscalationSummary", () => {
  it("dice cuánto esperó y que nadie acusó recibo", () => {
    const resumen = buildEscalationSummary("Dolores Fernández", "posible dolor torácico", 23);
    expect(resumen).toContain("SIN ATENDER (23 min)");
    expect(resumen).toContain("Dolores Fernández");
    expect(resumen).toContain("acusó recibo");
  });
});

describe("minutesSince", () => {
  it("redondea hacia abajo", () => {
    expect(minutesSince(hace(7), AHORA)).toBe(7);
    expect(minutesSince(new Date(AHORA.getTime() - 90_000).toISOString(), AHORA)).toBe(1);
  });
});

describe("resolveEscalationTarget", () => {
  it("prefiere el canal propio de escalado", () => {
    const target = resolveEscalationTarget({
      ALERT_WEBHOOK_URL: "https://slack.example/recepcion",
      ESCALATION_WEBHOOK_URL: "https://sms.example/guardia",
    });
    expect(target).toEqual({ url: "https://sms.example/guardia", isFallback: false });
  });

  it("cae al canal del primer aviso y lo marca como fallback", () => {
    const target = resolveEscalationTarget({
      ALERT_WEBHOOK_URL: "https://slack.example/recepcion",
      ESCALATION_WEBHOOK_URL: "",
    });
    expect(target).toEqual({ url: "https://slack.example/recepcion", isFallback: true });
  });

  it("ignora una URL que es solo espacios", () => {
    const target = resolveEscalationTarget({
      ALERT_WEBHOOK_URL: "https://slack.example/recepcion",
      ESCALATION_WEBHOOK_URL: "   ",
    });
    expect(target?.isFallback).toBe(true);
  });

  it("devuelve null sin ningún webhook configurado", () => {
    expect(resolveEscalationTarget({ ALERT_WEBHOOK_URL: "", ESCALATION_WEBHOOK_URL: "" })).toBeNull();
  });
});
