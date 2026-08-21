import { useState, type FormEvent } from "react";
import type { Clinic } from "@serena/types";
import { supabase } from "@/lib/supabase";
import { startOnboarding } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  clinic: Clinic | null;
  onDone: () => void;
  onCancel: () => void;
}

/** Alta de paciente + disparo opcional del primer WhatsApp de Serena. */
export function NewPatientForm({ clinic, onDone, onCancel }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [sendNow, setSendNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!clinic) return;
    setBusy(true);
    setError(null);

    // La Cloud API trabaja en E.164 sin '+': se normaliza aquí, una sola vez.
    const whatsappNumber = phone.replace(/\D/g, "");

    const { data, error: insertError } = await supabase
      .from("patients")
      .insert({ clinic_id: clinic.id, full_name: fullName.trim(), whatsapp_number: whatsappNumber })
      .select("id")
      .single();

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Ese número ya tiene un onboarding en esta clínica."
          : insertError.message,
      );
      setBusy(false);
      return;
    }

    if (sendNow && data) {
      try {
        await startOnboarding(data.id);
      } catch (err) {
        setError(`Paciente creado, pero no se pudo enviar el WhatsApp: ${(err as Error).message}`);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre y apellido</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Dolores Fernández"
          required
          minLength={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="whatsapp">WhatsApp (con código de país)</Label>
        <Input
          id="whatsapp"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 9 11 3333 4444"
          inputMode="tel"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
        <input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} />
        Enviar ahora la invitación de Serena
      </label>

      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Guardando…" : "Agregar paciente"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
