import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import {
  EMPTY_EXTRACTED_DATA,
  nextPendingStep,
  onboardingProgress,
  type ExtractedData,
  type OnboardingLog,
} from "@serena/types";
import { usePatient } from "@/hooks/usePatients";
import { supabase } from "@/lib/supabase";
import { startOnboarding } from "@/lib/api";
import { PatientProfile } from "@/components/PatientProfile";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatPhone } from "@/lib/utils";

export function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { patient, loading } = usePatient(id);
  const [logs, setLogs] = useState<OnboardingLog[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void supabase
      .from("onboarding_logs")
      .select("*")
      .eq("patient_id", id)
      .order("timestamp", { ascending: true })
      .then(({ data }) => setLogs(data ?? []));
  }, [id, patient?.updated_at]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!patient) {
    return <p className="text-sm text-ink-soft">No encontramos ese paciente.</p>;
  }

  const data: ExtractedData = { ...EMPTY_EXTRACTED_DATA, ...(patient.extracted_data as Partial<ExtractedData>) };
  const progress = onboardingProgress(data);
  const pending = nextPendingStep(data);

  async function handleSend() {
    if (!patient) return;
    setSending(true);
    setError(null);
    try {
      await startOnboarding(patient.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/pacientes" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft size={15} />
        Pacientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">{patient.full_name}</h1>
            <StatusBadge status={patient.status} />
          </div>
          <p className="text-sm text-ink-soft tabular">{formatPhone(patient.whatsapp_number)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-44 space-y-1.5">
            <div className="flex items-baseline justify-between text-xs text-ink-faint">
              <span>Ficha completa</span>
              <span className="tabular">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <Button variant="accent" onClick={() => void handleSend()} disabled={sending}>
            <Send size={15} />
            {patient.status === "pending_onboarding" ? "Enviar invitación" : "Reenviar pregunta"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {pending && (
        <p className="text-sm text-ink-soft">
          Serena está esperando: <span className="text-ink">{pending.label.toLowerCase()}</span>.
        </p>
      )}

      <PatientProfile data={data} />

      <Card>
        <CardHeader className="flex items-center gap-2">
          <MessageCircle size={15} className="text-ink-faint" />
          <CardTitle>Conversación ({logs.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {logs.length === 0 ? (
            <p className="text-sm text-ink-faint">Todavía no hay mensajes.</p>
          ) : (
            <ol className="space-y-3">
              {logs.map((log) => {
                const fromSerena = log.message_type === "text_out";
                return (
                  <li key={log.id} className={fromSerena ? "" : "pl-8"}>
                    <div
                      className={
                        fromSerena
                          ? "rounded-card bg-accent-soft px-4 py-2.5"
                          : "rounded-card bg-canvas px-4 py-2.5 ring-1 ring-line ring-inset"
                      }
                    >
                      <div className="mb-1 flex items-baseline justify-between gap-4">
                        <span className="text-xs font-medium text-ink-soft">
                          {fromSerena ? "Serena" : log.message_type === "audio_in" ? "Paciente · nota de voz" : "Paciente"}
                        </span>
                        <span className="text-xs text-ink-faint tabular">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                        {log.transcription ?? "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
