-- =============================================================================
-- Serena · Escalado de alertas sin atender
-- Una alerta que nadie acusa recibo se queda esperando en el panel para
-- siempre. Sirve para recepción atendida; no sirve para guardia nocturna.
-- =============================================================================

alter table public.urgency_alerts
  add column if not exists escalated_at timestamptz;

-- El barrido del cron busca exactamente esto: sin acusar recibo y sin escalar.
-- El índice parcial lo mantiene barato aunque la tabla crezca con el histórico.
create index if not exists urgency_alerts_por_escalar_idx
  on public.urgency_alerts (created_at)
  where acknowledged_at is null and escalated_at is null;
