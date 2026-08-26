import { DASHBOARD_URL } from "./site";

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
      <p className="mb-5 inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
        Onboarding clínico para la economía plateada
      </p>

      <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
        Conocé a Serena, la asistente de voz que digitaliza tu clínica sin frustrar a tus pacientes mayores.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Tus pacientes reciben un WhatsApp y contestan hablando, como le hablarían a un nieto. Serena escucha,
        entiende y deja la ficha clínica completa en tu panel. Sin formularios, sin llamadas, sin planillas.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-3">
        <a
          href={`${DASHBOARD_URL}/login`}
          className="inline-flex h-11 items-center rounded-md bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-ink/90"
        >
          Empezar gratis
        </a>
        <a
          href="#como-funciona"
          className="inline-flex h-11 items-center rounded-md border border-line bg-surface px-6 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          Ver cómo funciona
        </a>
      </div>

      <p className="mt-4 text-sm text-ink-faint">
        14 días de prueba · Sin tarjeta · Se conecta a tu número de WhatsApp actual
      </p>

      <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        {[
          { stat: "0", label: "formularios que el paciente tiene que llenar" },
          { stat: "0", label: "aplicaciones que tiene que instalar" },
          { stat: "1", label: "pregunta por mensaje, siempre" },
        ].map((item) => (
          <div key={item.label} className="bg-surface px-6 py-7">
            <p className="text-3xl font-semibold tracking-tight text-ink">{item.stat}</p>
            <p className="mt-1 text-sm leading-snug text-ink-soft">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
