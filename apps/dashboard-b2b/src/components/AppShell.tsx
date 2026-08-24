import { Link, NavLink, Outlet } from "react-router-dom";
import { LogOut, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UrgencyBanner } from "@/components/UrgencyBanner";
import { SOURCE_URL } from "@/lib/config";

export function AppShell() {
  const { clinic, session, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/pacientes" className="text-sm font-semibold tracking-tight">
              Serena
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/pacientes"
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm",
                    isActive ? "bg-canvas text-ink" : "text-ink-soft hover:text-ink",
                  )
                }
              >
                <Users size={15} />
                Pacientes
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm text-ink">{clinic?.name ?? "…"}</p>
              <p className="text-xs text-ink-faint">{session?.user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Cerrar sesión">
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </header>

      <UrgencyBanner />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>

      {/* AGPL §13: el usuario del servicio tiene derecho a llegar al código. */}
      <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs text-ink-faint">
        Serena · AGPL-3.0 ·{" "}
        <a
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:text-ink-soft hover:underline"
        >
          código fuente
        </a>
      </footer>
    </div>
  );
}
