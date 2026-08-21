-- =============================================================================
-- Serena · Esquema base (Fase 1)
-- Multi-tenant por `clinic_id`. Cada clinica solo ve sus propios datos.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums ------
do $$ begin
  create type public.subscription_tier as enum ('trial', 'starter', 'clinic', 'enterprise');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.patient_status as enum ('pending_onboarding', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_type as enum ('audio_in', 'text_in', 'text_out');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------- clinics -----
create table if not exists public.clinics (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 120),
  subscription_tier public.subscription_tier not null default 'trial',
  created_at        timestamptz not null default now()
);

-- Une un usuario de Supabase Auth con la clinica a la que pertenece (tenant).
create table if not exists public.clinic_members (
  clinic_id  uuid not null references public.clinics (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (clinic_id, user_id)
);

create index if not exists clinic_members_user_id_idx on public.clinic_members (user_id);

-- -------------------------------------------------------------- patients -----
create table if not exists public.patients (
  id              uuid primary key default gen_random_uuid(),
  clinic_id       uuid not null references public.clinics (id) on delete cascade,
  full_name       text not null check (char_length(full_name) between 2 and 160),
  -- E.164 sin '+' (formato que devuelve la Cloud API de WhatsApp): 5491133334444
  whatsapp_number text not null check (whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  status          public.patient_status not null default 'pending_onboarding',
  extracted_data  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

-- Un mismo numero no puede estar en onboarding dos veces en la misma clinica.
create unique index if not exists patients_clinic_whatsapp_key
  on public.patients (clinic_id, whatsapp_number);

-- El worker resuelve el paciente a partir del numero entrante: indice caliente.
create index if not exists patients_whatsapp_number_idx on public.patients (whatsapp_number);
create index if not exists patients_clinic_status_idx  on public.patients (clinic_id, status);

-- ------------------------------------------------------- onboarding_logs -----
create table if not exists public.onboarding_logs (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references public.patients (id) on delete cascade,
  message_type  public.message_type not null,
  transcription text,
  media_id      text,
  "timestamp"   timestamptz not null default now()
);

create index if not exists onboarding_logs_patient_idx
  on public.onboarding_logs (patient_id, "timestamp" desc);

-- ------------------------------------------------------------- triggers ------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row execute function public.touch_updated_at();

-- Al registrarse un usuario se crea su clinica y su membresia de owner.
-- El nombre viene en el metadata del signup: { data: { clinic_name: "..." } }.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_clinic_id uuid;
begin
  insert into public.clinics (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'clinic_name', ''), 'Mi clínica'))
  returning id into new_clinic_id;

  insert into public.clinic_members (clinic_id, user_id, role)
  values (new_clinic_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
