-- =============================================================================
-- Serena · Row Level Security (Fase 1)
-- Regla unica: un usuario solo alcanza filas cuya clinica esta en su membresia.
-- El worker del edge usa la service_role key, que salta RLS por diseno.
-- =============================================================================

-- SECURITY DEFINER evita la recursion de politicas: si `clinic_members` se
-- consultara con RLS activo dentro de su propia politica, Postgres cicla.
create or replace function public.user_clinic_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select clinic_id from public.clinic_members where user_id = auth.uid();
$$;

revoke all on function public.user_clinic_ids() from public;
grant execute on function public.user_clinic_ids() to authenticated;

alter table public.clinics         enable row level security;
alter table public.clinic_members  enable row level security;
alter table public.patients        enable row level security;
alter table public.onboarding_logs enable row level security;

-- ------------------------------------------------------------- clinics -------
drop policy if exists clinics_select on public.clinics;
create policy clinics_select on public.clinics
  for select to authenticated
  using (id in (select public.user_clinic_ids()));

drop policy if exists clinics_update on public.clinics;
create policy clinics_update on public.clinics
  for update to authenticated
  using (id in (select public.user_clinic_ids()))
  with check (id in (select public.user_clinic_ids()));

-- Las clinicas se crean por el trigger `handle_new_user` (security definer),
-- no hay INSERT directo desde el cliente.

-- ------------------------------------------------------ clinic_members -------
drop policy if exists clinic_members_select on public.clinic_members;
create policy clinic_members_select on public.clinic_members
  for select to authenticated
  using (clinic_id in (select public.user_clinic_ids()));

-- ------------------------------------------------------------ patients -------
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select to authenticated
  using (clinic_id in (select public.user_clinic_ids()));

drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients
  for insert to authenticated
  with check (clinic_id in (select public.user_clinic_ids()));

drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients
  for update to authenticated
  using (clinic_id in (select public.user_clinic_ids()))
  with check (clinic_id in (select public.user_clinic_ids()));

drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients
  for delete to authenticated
  using (clinic_id in (select public.user_clinic_ids()));

-- ----------------------------------------------------- onboarding_logs -------
-- Auditoria: se lee, no se escribe desde el dashboard. Solo el worker inserta.
drop policy if exists onboarding_logs_select on public.onboarding_logs;
create policy onboarding_logs_select on public.onboarding_logs
  for select to authenticated
  using (
    exists (
      select 1
      from public.patients p
      where p.id = onboarding_logs.patient_id
        and p.clinic_id in (select public.user_clinic_ids())
    )
  );
