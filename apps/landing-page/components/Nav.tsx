import Link from "next/link";
import { DASHBOARD_URL } from "./site";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Serena
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft sm:flex">
          <a href="#como-funciona" className="hover:text-ink">Cómo funciona</a>
          <a href="#beneficios" className="hover:text-ink">Beneficios</a>
          <a href="#precios" className="hover:text-ink">Precios</a>
          <a href="#preguntas" className="hover:text-ink">Preguntas</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href={`${DASHBOARD_URL}/login`} className="text-sm text-ink-soft hover:text-ink">
            Entrar
          </a>
          <a
            href={`${DASHBOARD_URL}/login`}
            className="inline-flex h-9 items-center rounded-md bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink/90"
          >
            Probar gratis
          </a>
        </div>
      </div>
    </header>
  );
}
