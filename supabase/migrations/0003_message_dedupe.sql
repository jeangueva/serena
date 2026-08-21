-- =============================================================================
-- Serena · Idempotencia del webhook
-- Meta reintenta si no ve un 200 a tiempo, y el mismo `message.id` puede llegar
-- varias veces. Sin esto se transcribe y se cobra el audio dos veces, y el
-- paciente recibe la misma pregunta repetida.
-- =============================================================================

create table if not exists public.processed_messages (
  message_id   text primary key,          -- id que asigna WhatsApp (wamid...)
  patient_id   uuid references public.patients (id) on delete cascade,
  processed_at timestamptz not null default now()
);

create index if not exists processed_messages_processed_at_idx
  on public.processed_messages (processed_at);

-- Solo el worker (service_role) escribe aquí. RLS activo sin políticas =
-- ningún usuario autenticado alcanza la tabla.
alter table public.processed_messages enable row level security;

-- Higiene: la tabla solo sirve para la ventana de reintentos de Meta (horas).
-- Programar con pg_cron si está disponible:
--   select cron.schedule('serena-purge-processed', '0 4 * * *',
--     $$delete from public.processed_messages where processed_at < now() - interval '7 days'$$);
