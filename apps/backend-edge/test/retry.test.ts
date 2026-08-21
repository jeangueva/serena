import { describe, expect, it, vi } from "vitest";
import { HttpError, isRetryable, withRetry } from "../src/lib/retry";

describe("withRetry", () => {
  it("devuelve el resultado sin reintentar cuando no hay error", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("reintenta un 500 y termina bien", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new HttpError(503, "meta caída"))
      .mockResolvedValue("ok");

    await expect(withRetry(fn, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("reintenta un 429", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(429, "rate limit"));
    await expect(withRetry(fn, { baseDelayMs: 1, attempts: 3 })).rejects.toThrow("rate limit");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("no reintenta un 400: repetir una petición mal formada no la arregla", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(400, "payload inválido"));
    await expect(withRetry(fn, { baseDelayMs: 1 })).rejects.toThrow("payload inválido");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("propaga el último error al agotar los intentos", async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError(500, "boom"));
    await expect(withRetry(fn, { baseDelayMs: 1, attempts: 2 })).rejects.toThrow("boom");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("isRetryable", () => {
  it("clasifica por status", () => {
    expect(isRetryable(new HttpError(500, ""))).toBe(true);
    expect(isRetryable(new HttpError(429, ""))).toBe(true);
    expect(isRetryable(new HttpError(408, ""))).toBe(true);
    expect(isRetryable(new HttpError(404, ""))).toBe(false);
    expect(isRetryable(new HttpError(401, ""))).toBe(false);
  });

  it("reintenta fallos de red (TypeError de fetch)", () => {
    expect(isRetryable(new TypeError("network error"))).toBe(true);
  });
});
