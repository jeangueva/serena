import { useCallback, useEffect, useState } from "react";
import type { UrgencyAlert } from "@serena/types";
import { supabase } from "@/lib/supabase";

export interface AlertWithPatient extends UrgencyAlert {
  patient_name: string;
}

/**
 * Alertas de urgencia sin acusar recibo, en vivo.
 * RLS ya limita a la clínica del usuario: no hace falta filtrar por clinic_id.
 */
export function useUrgencyAlerts() {
  const [alerts, setAlerts] = useState<AlertWithPatient[]>([]);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("urgency_alerts")
      .select("*")
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setAlerts([]);
      return;
    }

    // Segunda consulta en vez de embed: mantiene los tipos simples y son
    // pocas filas por definición (una urgencia sin atender no es lo normal).
    const { data: patients } = await supabase
      .from("patients")
      .select("id, full_name")
      .in("id", [...new Set(data.map((a) => a.patient_id))]);

    const names = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
    setAlerts(data.map((alert) => ({ ...alert, patient_name: names.get(alert.patient_id) ?? "Paciente" })));
  }, []);

  useEffect(() => {
    void reload();

    const channel = supabase
      .channel("urgency-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "urgency_alerts" }, () => void reload())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const acknowledge = useCallback(
    async (alertId: string) => {
      const { data: session } = await supabase.auth.getUser();
      await supabase
        .from("urgency_alerts")
        .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: session.user?.id ?? null })
        .eq("id", alertId);
      await reload();
    },
    [reload],
  );

  return { alerts, acknowledge };
}
