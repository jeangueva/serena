# Lanzamiento

Estado: **el código está listo, el servicio no**. Lo que falta no es programar,
son cuentas, aprobaciones externas y dos decisiones legales.

## Bloqueantes duros

Ninguno de estos se resuelve con un commit.

| # | Bloqueante | Quién | Cuánto tarda |
|---|---|---|---|
| 1 | Proyecto de Supabase creado y migraciones aplicadas | vos | 20 min |
| 2 | Número de WhatsApp Business verificado por Meta | Meta | 1–5 días |
| 3 | Plantilla `serena_invitacion_onboarding` aprobada | Meta | horas a 2 días |
| 4 | Claves de Anthropic y OpenAI con facturación activa | vos | 10 min |
| 5 | Base legal para tratar datos de salud + texto de consentimiento | vos / abogado | — |
| 6 | Política de privacidad publicada y enlazada desde la landing | vos | — |

Los puntos 5 y 6 no son burocracia: Serena recibe diagnósticos, medicación y
documentos de identidad de personas mayores. Sin consentimiento explícito y sin
contrato de encargo de tratamiento con cada clínica, el primer paciente real ya
es una infracción — y en salud las sanciones se calculan sobre la facturación
del grupo, no sobre lo que factura Serena.

## Orden de despliegue

Cada paso asume el anterior hecho.

### 1. Supabase

```bash
supabase link --project-ref <ref>
supabase db push
```

Luego, en el panel de Supabase: Database → Replication → activar Realtime en
`patients` y `urgency_alerts`. Sin eso el panel no se actualiza solo y el
banner de urgencias no aparece hasta recargar.

### 2. Worker

Reemplazar los placeholders de `apps/backend-edge/wrangler.toml`:

- `SUPABASE_URL` → la URL real del proyecto
- `WHATSAPP_PHONE_NUMBER_ID` → el ID del número verificado

Cargar los secretos y desplegar:

```bash
cd apps/backend-edge
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put WHATSAPP_TOKEN
wrangler secret put WHATSAPP_APP_SECRET
wrangler secret put WHATSAPP_VERIFY_TOKEN     # inventado por vos, string aleatorio
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put ALERT_WEBHOOK_URL         # opcional
wrangler secret put ESCALATION_WEBHOOK_URL    # opcional, otra vía
pnpm deploy
```

### 3. Webhook en Meta

Apuntar a `https://<worker>.workers.dev/webhook/whatsapp` con el mismo
`WHATSAPP_VERIFY_TOKEN`, y suscribir el campo `messages`.

Verificación de que quedó bien: el handshake devuelve el challenge, no un 500.
Un 500 significa que el secreto no llegó al worker.

### 4. Frontends

Panel (Cloudflare Pages, Vercel o Netlify; es un SPA estático):

```bash
cd apps/dashboard-b2b && pnpm build     # sirve dist/
```

Necesita `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL` y
`VITE_SOURCE_URL` en el build. Ojo con el fallback de rutas: es SPA, todas las
rutas tienen que servir `index.html` o `/pacientes/:id` da 404 al recargar.

Landing (Vercel):

```bash
cd apps/landing-page && pnpm build
```

Con `NEXT_PUBLIC_SITE_URL` apuntando al dominio real, o el sitemap, el canonical
y los datos estructurados quedan mintiendo sobre dónde vive el sitio.

## Prueba de humo antes de invitar a nadie

1. Registrar una clínica desde el panel.
2. Cargar un paciente con **tu propio número**.
3. Recibir la plantilla, contestar cualquier cosa.
4. Contestar con una nota de voz real, hablando lento.
5. Ver la ficha llenarse en el detalle del paciente.
6. Decir en un audio *"me duele el pecho desde ayer"* y comprobar: el banner rojo
   aparece, el cuestionario se corta y el mensaje deriva a emergencias.

El paso 6 es el que no se puede saltar. Si falla, no se lanza.

## Lo que la landing promete y todavía no existe

- Exportación a la historia clínica y HL7/FHIR: marcados como próximamente.
- Campos clínicos personalizados por clínica: el guion es el mismo para todos.
- "Usuarios ilimitados en el panel": técnicamente cierto, pero no hay pantalla
  para invitar a nadie. Hoy se agregan con un `insert` en `clinic_members`.

## Riesgos conocidos que se aceptan al lanzar

- **Nadie revisa la ficha antes de darla por completa.** Serena marca
  `completed` sola. Un dato mal transcrito entra a la historia clínica sin que
  un humano lo mire.
- **Transcripción con acento y ruido.** Whisper falla más con voz mayor, audio
  de WhatsApp comprimido y vocabulario de medicamentos. No hay métrica de esto.
- **La cadena de urgencia termina en el segundo aviso.** Si nadie atiende el
  reenvío, no pasa nada más.
