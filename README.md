# Serena

Onboarding clínico por voz para la Silver Economy. La clínica carga un paciente, Serena le
escribe por WhatsApp, el paciente **contesta con notas de voz** y la IA devuelve la ficha
clínica ya estructurada en un panel B2B.

```
apps/backend-edge     Cloudflare Workers + Hono   · webhook de WhatsApp, transcripción, extracción
apps/dashboard-b2b    React + Vite + Tailwind     · panel privado de la clínica (SPA)
apps/landing-page     Next.js App Router          · web comercial (SSR/SEO)
packages/shared-types Tipos TS compartidos        · Database, ExtractedData, guion de onboarding
supabase/             Esquema SQL + RLS + seed
```

## Puesta en marcha

```bash
pnpm install
cp .env.example .env            # referencia de todas las variables
```

### 1. Supabase

```bash
supabase db push                # aplica migrations/0001_init.sql y 0002_rls.sql
psql "$DATABASE_URL" -f supabase/seed.sql   # opcional: datos de demo
```

Activá Realtime para la tabla `patients` (Database → Replication) si querés que el panel se
actualice solo mientras el paciente contesta.

El registro de una clínica ocurre en el `signUp`: el trigger `handle_new_user` crea la fila en
`clinics` y la membresía `clinic_members` con el `clinic_name` que viene en el metadata.

### 2. Backend edge

```bash
cd apps/backend-edge
cp .dev.vars.example .dev.vars  # secretos locales
pnpm dev                        # http://localhost:8787
```

Producción:

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put WHATSAPP_TOKEN
wrangler secret put WHATSAPP_APP_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
pnpm deploy
```

En Meta (WhatsApp → Configuration) apuntá el webhook a
`https://<tu-worker>.workers.dev/webhook/whatsapp` con el mismo `WHATSAPP_VERIFY_TOKEN` y
suscribí el campo `messages`.

**Plantilla de invitación (obligatoria).** La clínica escribe primero, y fuera de la ventana de
24 h Meta solo acepta plantillas aprobadas: un texto libre se rechaza con el error 131047. Creá
en Meta Business Manager una plantilla de categoría `UTILITY`, en español, con una variable:

> Hola {{1}}, le escribimos de la clínica. Soy Serena y le voy a ayudar a completar su ficha
> por acá, con notas de voz. ¿Empezamos?

Poné su nombre en `WHATSAPP_TEMPLATE_NAME` (`wrangler.toml`). La conversación se abre cuando el
paciente contesta; ahí el worker manda el saludo y la primera pregunta en texto libre.

### 3. Dashboard

```bash
cd apps/dashboard-b2b
cp .env.example .env
pnpm dev                        # http://localhost:5173
```

### 4. Landing

```bash
cd apps/landing-page
pnpm dev                        # http://localhost:3000
```

## Cómo funciona un turno

1. Meta postea el mensaje en `POST /webhook/whatsapp`.
2. El worker valida `X-Hub-Signature-256` (HMAC-SHA256 con el app secret) y **responde 200 al
   instante**; el trabajo real corre en `ctx.waitUntil`. Meta corta a los ~5 s y reintenta: si
   el pipeline se ejecutara en línea, cada transcripción lenta sería un mensaje duplicado.
3. Se descarga la nota de voz de la Graph API y se transcribe (Whisper).
4. Una sola llamada a Claude devuelve, con `output_config.format` (JSON Schema):
   el objeto `ExtractedData` **fusionado** con lo que ya había, un acuse de recibo breve y
   un flag `requiere_repeticion` si el audio no se entendió.
5. La siguiente pregunta **no la elige el modelo**: sale de `ONBOARDING_STEPS`
   (`packages/shared-types/src/onboarding.ts`). El cuestionario avanza aunque el modelo divague.
6. Se guarda `extracted_data`, se marca `completed` cuando no quedan pasos y se responde por WhatsApp.

### Decisiones que conviene conocer

- **Modelo.** El PRD pedía "Claude 3.5 Sonnet"; el código usa `claude-sonnet-5`, el Sonnet
  vigente. Se cambia con la var `ANTHROPIC_MODEL` en `wrangler.toml`.
- **`confirmaciones_negativas`.** Una lista vacía es ambigua: no distingue "no preguntado" de
  "el paciente dijo que no tiene". Ese array guarda las negaciones explícitas, y el panel las
  muestra como confirmadas en vez de como huecos.
- **Aislamiento por clínica.** RLS con `user_clinic_ids()` (`SECURITY DEFINER`, para no entrar
  en recursión de políticas). El worker usa la `service_role` key y salta RLS a propósito, así
  que la ruta `/api/patients/:id/start-onboarding` verifica membresía a mano.
- **Los audios no se guardan.** Solo queda la transcripción en `onboarding_logs`.
- **Idempotencia.** Cada `message.id` se reserva en `processed_messages` (PK) antes de
  procesarlo. Meta reintenta el webhook: sin esa reserva el mismo audio se transcribe y se cobra
  dos veces, y el paciente recibe la pregunta repetida. La carrera la resuelve la primary key,
  no una lectura previa.
- **Reintentos.** `withRetry` (backoff exponencial + jitter) envuelve Graph API y Whisper. Solo
  reintenta 408/429/5xx y fallos de red; un 4xx no se repite porque repetirlo no lo arregla.

## Comandos

```bash
pnpm -r typecheck     # tsc --noEmit en los cuatro paquetes
pnpm -r build         # worker dry-run + vite build + next build
pnpm --filter @serena/backend-edge test
```

## Pendiente para producción

- Export de la ficha a la historia clínica (HL7/FHIR) — está vendido en la landing, no construido.
- Purga programada de `processed_messages` (hay un `cron.schedule` de ejemplo en la migración 0003).
- Revisión humana antes de dar la ficha por buena: hoy `completed` se marca solo.
- Detección de urgencias: el system prompt le dice a Serena que derive a emergencias, pero nadie
  avisa a la clínica cuando eso pasa.
