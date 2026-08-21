import { AlertTriangle } from "lucide-react";
import type { ExtractedData } from "@serena/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

/**
 * El JSON que extrae Serena, convertido en una ficha clínica legible.
 * Regla de lectura: lo que falta se ve como falta, nunca como vacío ambiguo.
 */
export function PatientProfile({ data }: { data: ExtractedData }) {
  const negadas = new Set(data.confirmaciones_negativas);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Las alergias van primero y solas: es el dato que evita un daño. */}
      <Card className={data.alergias.length > 0 ? "border-danger/40 lg:col-span-2" : "lg:col-span-2"}>
        <CardHeader className="flex items-center gap-2">
          {data.alergias.length > 0 && <AlertTriangle size={15} className="text-danger" />}
          <CardTitle>Alergias</CardTitle>
        </CardHeader>
        <CardBody>
          {data.alergias.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {data.alergias.map((item) => (
                <li key={item} className="rounded-md bg-danger/10 px-2.5 py-1 text-sm font-medium text-danger">
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <Empty negada={negadas.has("alergias")} negadaTexto="El paciente indicó que no tiene alergias." />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Field label="Documento" value={data.documento_identidad} mono />
          <Field label="Fecha de nacimiento" value={formatFecha(data.fecha_nacimiento)} />
          <Field label="Cobertura médica" value={data.cobertura_medica} />
          <Field label="Movilidad" value={data.movilidad} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto de emergencia</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <Field label="Nombre" value={data.contacto_emergencia.nombre} />
          <Field label="Relación" value={data.contacto_emergencia.relacion} />
          <Field label="Teléfono" value={data.contacto_emergencia.telefono} mono />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medicación actual</CardTitle>
        </CardHeader>
        <CardBody>
          {data.medicamentos.length > 0 ? (
            <ul className="divide-y divide-line">
              {data.medicamentos.map((med) => (
                <li key={med.nombre} className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0">
                  <span className="text-sm text-ink">{med.nombre}</span>
                  <span className="text-sm text-ink-soft tabular">
                    {[med.dosis, med.frecuencia].filter(Boolean).join(" · ") || "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty negada={negadas.has("medicamentos")} negadaTexto="El paciente indicó que no toma medicación." />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <ListBlock
            title="Condiciones crónicas"
            items={data.condiciones_cronicas}
            negada={negadas.has("condiciones_cronicas")}
          />
          <ListBlock
            title="Cirugías previas"
            items={data.cirugias_previas}
            negada={negadas.has("cirugias_previas")}
          />
        </CardBody>
      </Card>

      {data.notas_adicionales && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Notas adicionales</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm leading-relaxed text-ink-soft">{data.notas_adicionales}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs text-ink-faint">{label}</span>
      {value ? (
        <span className={mono ? "text-sm text-ink tabular" : "text-sm text-ink"}>{value}</span>
      ) : (
        <span className="text-sm text-ink-faint italic">Falta preguntar</span>
      )}
    </div>
  );
}

function ListBlock({ title, items, negada }: { title: string; items: string[]; negada: boolean }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink-faint">{title}</p>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="rounded-md bg-canvas px-2.5 py-1 text-sm text-ink ring-1 ring-line ring-inset">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <Empty negada={negada} negadaTexto="Sin registros, confirmado por el paciente." />
      )}
    </div>
  );
}

function Empty({ negada, negadaTexto }: { negada: boolean; negadaTexto: string }) {
  return <p className="text-sm text-ink-faint italic">{negada ? negadaTexto : "Falta preguntar"}</p>;
}

function formatFecha(iso: string | null): string | null {
  if (!iso) return null;
  const date = formatDate(iso);
  const edad = Math.floor((Date.now() - new Date(iso).getTime()) / 31_557_600_000);
  return Number.isFinite(edad) ? `${date} (${edad} años)` : date;
}
