import type { Env } from "../types";
import { HttpError, withRetry } from "./retry";

/**
 * Transcripcion de la nota de voz (OpenAI Whisper).
 * Aislado a proposito: cambiar de proveedor de STT no debe tocar el pipeline.
 */
export async function transcribeAudio(
  env: Env,
  blob: Blob,
  mimeType: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", blob, `nota-de-voz.${extensionFor(mimeType)}`);
  form.append("model", env.TRANSCRIPTION_MODEL);
  form.append("language", "es");
  // Sesga el decodificador hacia vocabulario clinico y hacia el habla pausada.
  form.append(
    "prompt",
    "Transcripcion de una nota de voz de un paciente adulto mayor en espanol. Puede mencionar medicamentos, dosis, alergias, obras sociales y numeros de documento.",
  );

  const json = await withRetry(
    async () => {
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: form,
      });
      if (!res.ok) throw new HttpError(res.status, `Whisper ${res.status}: ${await res.text()}`);
      return (await res.json()) as { text?: string };
    },
    { label: "whisper.transcribe", attempts: 3, baseDelayMs: 600 },
  );

  return (json.text ?? "").trim();
}

function extensionFor(mimeType: string): string {
  const clean = mimeType.split(";")[0] ?? "";
  const map: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/opus": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/amr": "amr",
    "audio/wav": "wav",
    "audio/webm": "webm",
  };
  return map[clean] ?? "ogg";
}
