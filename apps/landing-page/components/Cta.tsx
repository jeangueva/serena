import { DASHBOARD_URL } from "./site";

export function Cta() {
  return (
    <section className="border-t border-line bg-ink">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Tu próximo paciente puede completar su ficha hablando.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Conectá tu WhatsApp, cargá un paciente y mirá cómo llega la ficha sola. Se prueba en una tarde.
        </p>
        <a
          href={`${DASHBOARD_URL}/login`}
          className="mt-8 inline-flex h-11 items-center rounded-md bg-white px-6 text-sm font-medium text-ink transition-colors hover:bg-white/90"
        >
          Empezar gratis
        </a>
      </div>
    </section>
  );
}
