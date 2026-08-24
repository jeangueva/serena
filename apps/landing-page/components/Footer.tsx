import { SOURCE_URL } from "./site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-ink-faint">
        <p>© {new Date().getFullYear()} Serena. Onboarding clínico por voz.</p>
        <nav className="flex gap-6">
          <a href="#precios" className="hover:text-ink">Precios</a>
          <a href="#preguntas" className="hover:text-ink">Preguntas</a>
          <a href="mailto:hola@serena.health" className="hover:text-ink">hola@serena.health</a>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
            Código fuente · AGPL-3.0
          </a>
        </nav>
      </div>
    </footer>
  );
}
