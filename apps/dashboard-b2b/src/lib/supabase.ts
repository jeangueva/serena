import { createClient } from "@supabase/supabase-js";
import type { Database } from "@serena/types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env.");
}

/** Cliente del navegador: RLS activo, solo ve las filas de su clínica. */
export const supabase = createClient<Database>(url, anonKey);
