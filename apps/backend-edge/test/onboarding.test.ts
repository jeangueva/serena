import { describe, expect, it } from "vitest";
import {
  EMPTY_EXTRACTED_DATA,
  ONBOARDING_STEPS,
  nextPendingStep,
  onboardingProgress,
  type ExtractedData,
} from "@serena/types";

const clone = (patch: Partial<ExtractedData> = {}): ExtractedData => ({
  ...EMPTY_EXTRACTED_DATA,
  ...patch,
});

describe("guion de onboarding", () => {
  it("arranca por el documento", () => {
    expect(nextPendingStep(clone())?.key).toBe("documento_identidad");
    expect(onboardingProgress(clone())).toBe(0);
  });

  it("avanza al siguiente campo cuando el anterior está resuelto", () => {
    const data = clone({ documento_identidad: "12345678" });
    expect(nextPendingStep(data)?.key).toBe("fecha_nacimiento");
  });

  it("trata una negación explícita como respuesta, no como hueco", () => {
    const base = clone({ documento_identidad: "1", fecha_nacimiento: "1943-04-12" });
    expect(nextPendingStep(base)?.key).toBe("alergias");

    const negadas = { ...base, confirmaciones_negativas: ["alergias"] };
    expect(nextPendingStep(negadas)?.key).toBe("medicamentos");
  });

  it("un string vacío no cuenta como respondido", () => {
    expect(nextPendingStep(clone({ documento_identidad: "   " }))?.key).toBe("documento_identidad");
  });

  it("cierra el onboarding con todos los campos cubiertos", () => {
    const completo = clone({
      documento_identidad: "12345678",
      fecha_nacimiento: "1943-04-12",
      alergias: ["penicilina"],
      medicamentos: [{ nombre: "Enalapril", dosis: "10 mg", frecuencia: "una vez al día" }],
      condiciones_cronicas: ["hipertensión"],
      cobertura_medica: "PAMI",
      contacto_emergencia: { nombre: "Marta", telefono: "5491122223333", relacion: "hija" },
      movilidad: "camina sin ayuda",
    });

    expect(nextPendingStep(completo)).toBeNull();
    expect(onboardingProgress(completo)).toBe(100);
  });

  it("un contacto de emergencia sin teléfono sigue pendiente", () => {
    const data = clone({
      documento_identidad: "1",
      fecha_nacimiento: "1943-04-12",
      confirmaciones_negativas: ["alergias", "medicamentos", "condiciones_cronicas"],
      cobertura_medica: "PAMI",
      contacto_emergencia: { nombre: "Marta", telefono: null, relacion: "hija" },
    });
    expect(nextPendingStep(data)?.key).toBe("contacto_emergencia");
  });

  it("cada paso hace una sola pregunta", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.question.split("?").length - 1).toBeLessThanOrEqual(1);
    }
  });
});
