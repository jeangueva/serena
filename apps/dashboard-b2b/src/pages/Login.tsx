import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@/components/ui/card";

export function Login() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/pacientes" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, clinicName);
        setNotice("Cuenta creada. Revisá tu correo para confirmarla y luego iniciá sesión.");
        setMode("signin");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Serena</h1>
          <p className="text-sm text-ink-soft">Panel clínico</p>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="clinic">Nombre de la clínica</Label>
                  <Input
                    id="clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Centro Médico San Juan"
                    required
                    minLength={2}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}
              {notice && <p className="text-sm text-ok">{notice}</p>}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Un momento…" : mode === "signin" ? "Entrar" : "Crear cuenta"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <button
          type="button"
          className="text-sm text-ink-soft underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "¿Primera vez? Registrá tu clínica" : "Ya tengo cuenta"}
        </button>
      </div>
    </div>
  );
}
