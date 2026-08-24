import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useUrgencyAlerts } from "@/hooks/useUrgencyAlerts";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

/**
 * Lo único de esta interfaz que puede costar una vida.
 * Va arriba de todo, en rojo, y no se puede cerrar sin dejar constancia de
 * quién lo vio: acusar recibo escribe `acknowledged_by` en la base.
 */
export function UrgencyBanner() {
  const { alerts, acknowledge } = useUrgencyAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="border-b border-danger/30 bg-danger/10">
      <div className="mx-auto max-w-6xl space-y-3 px-6 py-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink">
                  Urgencia ·{" "}
                  <Link to={`/pacientes/${alert.patient_id}`} className="underline underline-offset-4">
                    {alert.patient_name}
                  </Link>
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">{alert.motivo}</p>
                {alert.frase_paciente && (
                  <p className="mt-1 text-sm italic text-ink-soft">“{alert.frase_paciente}”</p>
                )}
                <p className="mt-1 text-xs text-ink-faint tabular">{formatDateTime(alert.created_at)}</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => void acknowledge(alert.id)}>
              Ya lo atendimos
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
