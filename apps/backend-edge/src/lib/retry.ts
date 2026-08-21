export interface RetryOptions {
  /** Intentos totales, incluido el primero. */
  attempts?: number;
  /** Espera base en ms; crece exponencialmente. */
  baseDelayMs?: number;
  label?: string;
}

/**
 * Reintento con backoff exponencial y jitter.
 * Solo para fallos transitorios: un 4xx que no sea 429 no se reintenta nunca,
 * porque repetir una petición mal formada solo gasta cuota y tiempo.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === attempts) break;

      // Jitter: si Meta reintenta N mensajes a la vez, no deben rebotar en fase.
      const delay = baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random());
      console.warn(`${options.label ?? "retry"}: intento ${attempt}/${attempts} falló, reintento en ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

/** Error de una respuesta HTTP no exitosa, con el status para decidir el reintento. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 408 || err.status === 429 || err.status >= 500;
  // Fallo de red / DNS / socket: no llegó a haber respuesta, se reintenta.
  return err instanceof TypeError || err instanceof Error === false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
