import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { EMPTY_EXTRACTED_DATA, onboardingProgress, type ExtractedData } from "@serena/types";
import { useAuth } from "@/hooks/useAuth";
import { usePatients } from "@/hooks/usePatients";
import { NewPatientForm } from "@/components/NewPatientForm";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { formatDateTime, formatPhone } from "@/lib/utils";

export function Patients() {
  const { clinic } = useAuth();
  const { patients, loading, error, reload } = usePatients();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.full_name.toLowerCase().includes(q) || p.whatsapp_number.includes(q.replace(/\D/g, "")),
    );
  }, [patients, query]);

  const pendientes = patients.filter((p) => p.status !== "completed").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-ink-soft">
            {patients.length} en total · {pendientes} con onboarding abierto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o teléfono"
              className="w-64 pl-9"
              aria-label="Buscar pacientes"
            />
          </div>
          <Button onClick={() => setAdding((v) => !v)}>
            <Plus size={15} />
            Nuevo paciente
          </Button>
        </div>
      </div>

      {adding && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo paciente</CardTitle>
          </CardHeader>
          <CardBody>
            <NewPatientForm
              clinic={clinic}
              onCancel={() => setAdding(false)}
              onDone={() => {
                setAdding(false);
                void reload();
              }}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        {loading ? (
          <CardBody className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </CardBody>
        ) : error ? (
          <CardBody>
            <p className="text-sm text-danger">{error}</p>
          </CardBody>
        ) : filtered.length === 0 ? (
          <CardBody>
            <p className="text-sm text-ink-soft">
              {patients.length === 0
                ? "Todavía no hay pacientes. Agregá el primero y Serena se encarga del resto."
                : "Ningún paciente coincide con la búsqueda."}
            </p>
          </CardBody>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Paciente</Th>
                <Th>WhatsApp</Th>
                <Th>Estado</Th>
                <Th className="w-40">Avance</Th>
                <Th>Última actividad</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => {
                const data = { ...EMPTY_EXTRACTED_DATA, ...(patient.extracted_data as Partial<ExtractedData>) };
                const progress = onboardingProgress(data);
                return (
                  <Tr key={patient.id}>
                    <Td>
                      <Link
                        to={`/pacientes/${patient.id}`}
                        className="font-medium text-ink underline-offset-4 hover:underline"
                      >
                        {patient.full_name}
                      </Link>
                    </Td>
                    <Td className="text-ink-soft tabular">{formatPhone(patient.whatsapp_number)}</Td>
                    <Td>
                      <StatusBadge status={patient.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} />
                        <span className="w-9 text-right text-xs text-ink-faint tabular">{progress}%</span>
                      </div>
                    </Td>
                    <Td className="text-ink-soft">{formatDateTime(patient.updated_at)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
