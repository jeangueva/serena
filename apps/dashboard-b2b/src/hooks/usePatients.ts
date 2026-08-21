import { useCallback, useEffect, useState } from "react";
import type { Patient } from "@serena/types";
import { supabase } from "@/lib/supabase";

interface PatientsState {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePatients(): PatientsState {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("patients")
      .select("*")
      .order("updated_at", { ascending: false });

    if (err) setError(err.message);
    else {
      setPatients(data ?? []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();

    // Serena escribe desde el edge: la tabla se actualiza sola mientras el
    // paciente contesta, sin que nadie recargue la pagina.
    const channel = supabase
      .channel("patients-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => void reload())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  return { patients, loading, error, reload };
}

export function usePatient(patientId: string | undefined) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!patientId) return;
    const { data } = await supabase.from("patients").select("*").eq("id", patientId).maybeSingle();
    setPatient(data ?? null);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    void reload();
    if (!patientId) return;

    const channel = supabase
      .channel(`patient-${patientId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "patients", filter: `id=eq.${patientId}` },
        () => void reload(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientId, reload]);

  return { patient, loading, reload };
}
