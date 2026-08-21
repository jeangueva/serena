# Documento de Requerimientos y System Prompt
## Producto: Serena - MVP SaaS SilverTech (Onboarding Inclusivo Voz a Datos)

**Objetivo para el Agente (Claude Code / Cursor):** 
Actúa como un Senior Full-Stack Engineer y Lead de Producto/UX. Tu tarea es inicializar, estructurar y codificar un MVP B2B enfocado en la "Silver Economy". El producto se llama **Serena**, un sistema que permite a clínicas y agencias enviar formularios complejos a adultos mayores a través de WhatsApp. El usuario final interactúa con "Serena", una asistente de IA diseñada para responder con paciencia infinita, donde el paciente responde únicamente con notas de voz. La IA procesa estos audios, extrae la data estructurada y la presenta al personal administrativo en un dashboard B2B de cero fricción.

La arquitectura se divide en tres piezas clave para optimizar rendimiento (Edge), SEO (SSR) y velocidad de gestión (SPA).

---

## 1. Arquitectura y Stack Tecnológico

Estructuraremos el proyecto como un monorepo (o directorios separados) con las siguientes piezas:

*   **`apps/backend-edge` (El Cerebro de Serena - Baja Latencia):** 
    *   Cloudflare Workers + Hono.js + TypeScript.
    *   Responsabilidad: Recibir webhooks de WhatsApp (Meta API), invocar la transcripción (OpenAI Whisper o Anthropic), procesar la lógica de extracción de datos con Claude 3.5 Sonnet (usando la "personalidad" de Serena) y actualizar la base de datos.
*   **`apps/dashboard-b2b` (La Herramienta Privada - SPA Rápida):** 
    *   React 18+ + Vite + TypeScript.
    *   UI: Tailwind CSS + `shadcn/ui`.
    *   Responsabilidad: Panel de control de la clínica, gestión de pacientes y visualización de datos extraídos (Kanban/Tablas). Conexión directa a Supabase.
*   **`apps/landing-page` (La Cara Pública - SSR/SEO):**
    *   Next.js 14+ (App Router) + Tailwind CSS.
    *   Responsabilidad: Web comercial, indexación en Google, información de precios y botón de Login/Registro. El copy debe vender a "Serena" como la solución definitiva de onboarding.
*   **Infraestructura de Datos & Auth:** Supabase (PostgreSQL, Row Level Security, Auth).

---

## 2. Modelado de Datos (Supabase)

Genera el esquema SQL asegurando políticas de RLS para que cada clínica vea solo sus datos (`tenant_id`):

1. **`clinics`** (Las empresas cliente)
   - `id` (uuid, PK)
   - `name` (text)
   - `subscription_tier` (text)
   - `created_at` (timestamp)

2. **`patients`** (Los adultos mayores)
   - `id` (uuid, PK)
   - `clinic_id` (uuid, FK)
   - `full_name` (text)
   - `whatsapp_number` (text)
   - `status` (text: 'pending_onboarding', 'in_progress', 'completed')
   - `extracted_data` (jsonb - Aquí se guarda la información estructurada que saca Serena)

3. **`onboarding_logs`** (Auditoría del chat de WhatsApp)
   - `id` (uuid, PK)
   - `patient_id` (uuid, FK)
   - `message_type` (text: 'audio_in', 'text_out')
   - `transcription` (text)
   - `timestamp` (timestamp)

---

## 3. Plan de Ejecución Paso a Paso

Por favor, ejecuta esto de forma secuencial, verificando que cada pieza funcione antes de pasar a la siguiente.

### Fase 1: Setup e Infraestructura
1. Crea la estructura de carpetas (`dashboard`, `backend`, `landing`).
2. Configura el esquema de Supabase y las políticas de RLS.
3. Inicializa la autenticación para que las clínicas puedan registrarse e iniciar sesión.

### Fase 2: El Motor de IA en el Edge (Cloudflare Worker)
1. Inicializa el proyecto Hono.js.
2. Crea el endpoint `POST /webhook/whatsapp`.
3. Implementa la lógica de orquestación:
   - Extraer el audio del mensaje entrante.
   - Transcribir el audio a texto.
   - Pasar el texto a Claude 3.5 Sonnet con un prompt de sistema estricto: **"Eres Serena, una asistente clínica empática y ultra-paciente..."** y pedirle extraer entidades específicas (DNI, alergias, medicamentos).
   - Guardar el resultado en formato JSON en el campo `extracted_data` de la tabla `patients`.

### Fase 3: Dashboard Vite (React)
1. Configura Vite, Tailwind y `shadcn/ui`.
2. Implementa las rutas protegidas.
3. Construye la interfaz principal: Una tabla de datos limpia donde el personal clínico pueda ver a los pacientes y abrir una vista detallada que muestre el JSON transformado en un perfil médico legible.
4. **Criterio de UX:** La interfaz debe ser minimalista, enfocada en la legibilidad, asumiendo que el usuario es personal administrativo que necesita procesar información rápido sin distracciones visuales.

### Fase 4: Landing Page Next.js
1. Inicializa Next.js con el App Router.
2. Crea una página de inicio (`page.tsx`) optimizada para SEO.
3. El mensaje principal debe ser: "Conoce a Serena, la asistente de voz que digitaliza tu clínica sin frustrar a tus pacientes mayores".

---

## 4. Reglas de Desarrollo
- **Tipos estrictos:** Crea una carpeta compartida o define interfaces TypeScript claras para los modelos de Supabase y el JSON de `extracted_data`.
- **Rendimiento:** El Worker debe responder a Meta rápidamente (menos de 5s) para evitar timeouts. Implementa el procesamiento en segundo plano si la transcripción tarda.
- **Diseño de Interfaz:** Aplica principios de diseño de producto sólidos; usa jerarquía tipográfica, espacios en blanco y componentes modulares.

**Inicia el proyecto configurando la estructura base y la Fase 1.**
