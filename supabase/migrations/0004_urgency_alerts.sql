-- =============================================================================
-- Serena · Alertas de urgencia
-- El system prompt le dice a Serena que derive a emergencias, pero eso solo
-- ayuda al paciente que está del otro lado del teléfono. La clínica también
-- tiene que enterarse, y tiene que quedar registrado quién se enteró y cuándo.
-- =============================================================================

create table if not exists public.urgency_alerts (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients (id) on delete cascade,
  -- Desnormalizado a propósito: la política de RLS filtra por clínica sin
  -- tener que unir con `patients` en cada lectura del banner.
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  motivo          text not null,
  frase_paciente  text,
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users (id) on delete set null
);

-- El banner del panel consulta exactamente esto: pendientes de una clínica.
create index if not exists urgency_alerts_pendientes_idx
  on public.urgency_alerts (clinic_id, created_at desc)
  where acknowledged_at is null;

create index if not exists urgency_alerts_patient_idx
  on public.urgency_alerts (patient_id, created_at desc);

alter table public.urgency_alerts enable row level security;

drop policy if exists urgency_alerts_select on public.urgency_alerts;
create policy urgency_alerts_select on public.urgency_alerts
  for select to authenticated
  using (clinic_id in (select public.user_clinic_ids()));

-- Solo se puede acusar recibo. Nadie borra una alerta desde el panel: el
-- registro de que la clínica fue avisada es justamente el valor de la tabla.
drop policy if exists urgency_alerts_acknowledge on public.urgency_alerts;
create policy urgency_alerts_acknowledge on public.urgency_alerts
  for update to authenticated
  using (clinic_id in (select public.user_clinic_ids()))
  with check (clinic_id in (select public.user_clinic_ids()));
