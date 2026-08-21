-- Datos de prueba para desarrollo local (`supabase db reset`).
-- Ojo: los pacientes necesitan una clinica; aqui se crea una suelta y luego
-- puedes asociar tu usuario con:
--   insert into clinic_members (clinic_id, user_id, role)
--   values ('00000000-0000-0000-0000-00000000c1a1', '<tu-user-id>', 'owner');

insert into public.clinics (id, name, subscription_tier)
values ('00000000-0000-0000-0000-00000000c1a1', 'Clínica Demo Serena', 'starter')
on conflict (id) do nothing;

insert into public.patients (id, clinic_id, full_name, whatsapp_number, status, extracted_data)
values
  ('00000000-0000-0000-0000-0000000000a1'::uuid,
   '00000000-0000-0000-0000-00000000c1a1',
   'Dolores Fernández', '5491133334444', 'in_progress',
   '{"documento_identidad":"12345678","fecha_nacimiento":"1943-04-12","alergias":["penicilina"],"medicamentos":[{"nombre":"Enalapril","dosis":"10 mg","frecuencia":"una vez al día"}],"condiciones_cronicas":["hipertensión"],"cirugias_previas":[],"contacto_emergencia":{"nombre":null,"telefono":null,"relacion":null},"cobertura_medica":null,"movilidad":null,"notas_adicionales":null}'::jsonb),
  ('00000000-0000-0000-0000-0000000000a2'::uuid,
   '00000000-0000-0000-0000-00000000c1a1',
   'Ramón Salazar', '5491155556666', 'pending_onboarding', '{}'::jsonb)
on conflict (id) do nothing;
