# Serena

[![CI](https://github.com/jeangueva/serena/actions/workflows/ci.yml/badge.svg)](https://github.com/jeangueva/serena/actions/workflows/ci.yml)
[![Estado](https://img.shields.io/badge/estado-MVP-blue)](https://github.com/jeangueva/serena)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-Hono-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Claude](https://img.shields.io/badge/Claude-Sonnet%205-D97757?logo=anthropic&logoColor=white)](https://docs.claude.com/)
[![Licencia](https://img.shields.io/badge/licencia-AGPL--3.0-blue)](LICENSE)

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

## Antes de empezar

Herramientas:

| Herramienta | Versión | Para qué |
|---|---|---|
| Node | ≥ 22 (probado en 24) | runtime de los tres builds |
| pnpm | 9.x | workspaces del monorepo |
| Wrangler | 4.x (viene como devDependency) | dev y deploy del worker |
| Supabase CLI | ≥ 1.200 | aplicar migraciones |

Cuentas y credenciales:

| Cuenta | Se usa para | Sin esto |
|---|---|---|
| [Supabase](https://supabase.com) | base de datos, auth y realtime | no arranca nada |
| [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) | mandar y recibir mensajes | el panel funciona, Serena no habla |
| [Anthropic](https://console.anthropic.com) | extracción de datos (Claude) | los audios se transcriben pero no se estructuran |
| [OpenAI](https://platform.openai.com) | transcripción (Whisper) | las notas de voz no se convierten en texto |

La landing no necesita credenciales: se puede levantar sola.

## Puesta en marcha

```bash
git clone https://github.com/jeangueva/serena.git
cd serena
pnpm install
cp .env.example .env            # referencia de todas las variables
```

### 1. Supabase

```bash
supabase link --project-ref <tu-project-ref>
supabase db push                # aplica las 3 migraciones de supabase/migrations/
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
wrangler secret put WHATSAPP_VERIFY_TOKEN
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
pnpm deploy
```

En Meta (WhatsApp → Configuration) apuntá el webhook a
`https://<tu-worker>.workers.dev/webhook/whatsapp` con el mismo `WHATSAPP_VERIFY_TOKEN` y
suscribí el campo `messages`. El `WHATSAPP_VERIFY_TOKEN` lo inventás vos: es el string que
Meta devuelve en el handshake para probar que el endpoint es tuyo. Va como secreto, no en
`wrangler.toml`; si falta, el handshake responde 500 en vez de aceptar cualquier registro.

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

## Dónde vive cada variable

| Variable | Dónde | Nota |
|---|---|---|
| `SUPABASE_URL`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_GRAPH_VERSION`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `ANTHROPIC_MODEL`, `TRANSCRIPTION_MODEL` | `apps/backend-edge/wrangler.toml` → `[vars]` | públicas, van al repo |
| `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | `wrangler secret put` (prod) · `.dev.vars` (local) | **nunca** al repo |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL` | `apps/dashboard-b2b/.env` | la anon key es pública por diseño; RLS es lo que protege |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DASHBOARD_URL` | `apps/landing-page/.env` | solo URLs |

La `service_role` key salta RLS. Si termina en un bundle de frontend, cualquiera lee los datos
de todas las clínicas: vive solo en el worker.

## Verificar que quedó bien

Cada push y cada PR contra `main` corren estos mismos tres pasos en CI
(`.github/workflows/ci.yml`). En local:

```bash
pnpm -r typecheck                          # 4/4 paquetes
pnpm --filter @serena/backend-edge test    # 18 tests
pnpm -r build                              # worker dry-run + vite + next
```

Levantar cada pieza por separado desde la raíz:

```bash
pnpm dev:backend      # worker  · http://localhost:8787
pnpm dev:dashboard    # panel   · http://localhost:5173
pnpm dev:landing      # landing · http://localhost:3000
```

Prueba de punta a punta: creá una clínica desde `/login`, agregá un paciente con tu propio
número, contestá con una nota de voz y mirá la ficha llenarse sola en el detalle del paciente.
Para que Meta alcance tu worker local hace falta un túnel (`cloudflared tunnel --url
http://localhost:8787`) y apuntar el webhook a esa URL.

## Licencia

[GNU AGPL-3.0](LICENSE) · Copyright (C) 2026 Serena.

En corto: el código se puede leer, usar, modificar y estudiar. Lo que cambia respecto de una
licencia permisiva es la cláusula de red (sección 13): **quien corra una versión modificada
como servicio tiene que publicar su código**, aunque nunca distribuya un binario. Es lo que
evita que un competidor levante un fork cerrado de Serena y lo venda.

Para uso comercial con otros términos, hay licencia propietaria disponible: hola@serena.health.

Pendiente de cumplimiento: la sección 13 pide que un servicio en red ofrezca a sus usuarios
una forma de obtener el código. Falta el enlace a este repositorio en el panel.

## Pendiente para producción

- Export de la ficha a la historia clínica (HL7/FHIR) — está vendido en la landing, no construido.
- Purga programada de `processed_messages` (hay un `cron.schedule` de ejemplo en la migración 0003).
- Revisión humana antes de dar la ficha por buena: hoy `completed` se marca solo.
- Detección de urgencias: el system prompt le dice a Serena que derive a emergencias, pero nadie
  avisa a la clínica cuando eso pasa.
