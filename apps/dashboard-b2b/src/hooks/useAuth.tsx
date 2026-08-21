import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Clinic } from "@serena/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  clinic: Clinic | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, clinicName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setClinic(null);
      return;
    }
    // RLS ya limita la consulta a la clínica del usuario: no hace falta filtrar.
    supabase
      .from("clinics")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setClinic(data));
  }, [session]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      clinic,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(traducirError(error.message));
      },
      async signUp(email, password, clinicName) {
        // `clinic_name` lo lee el trigger handle_new_user para crear el tenant.
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { clinic_name: clinicName } },
        });
        if (error) throw new Error(traducirError(error.message));
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, clinic, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (message.includes("already registered")) return "Ese email ya tiene una cuenta.";
  if (message.includes("Password should be")) return "La contraseña necesita al menos 6 caracteres.";
  return message;
}
