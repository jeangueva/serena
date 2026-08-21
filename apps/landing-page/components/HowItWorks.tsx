const STEPS = [
  {
    n: "01",
    title: "Cargás al paciente",
    body: "Nombre y número de WhatsApp. Nada más. Desde el panel o importando tu lista de admisiones.",
  },
  {
    n: "02",
    title: "Serena le escribe",
    body: "Le llega un mensaje de la clínica presentando a Serena. Le hace una sola pregunta por vez, con calma, y le pide que conteste hablando.",
  },
  {
    n: "03",
    title: "El paciente contesta con la voz",
    body: "Mantiene apretado el micrófono y habla. Si se corta, si duda o si se va por las ramas, Serena vuelve a preguntar sin apurarlo.",
  },
  {
    n: "04",
    title: "Vos ves la ficha lista",
    body: "Documento, alergias, medicación, cobertura y contacto de emergencia, ya estructurados y revisables en un panel pensado para leerse rápido.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Cuatro pasos. Ninguno cae del lado del paciente.
        </h2>

        <ol className="mt-12 grid gap-10 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-5">
              <span className="mt-0.5 text-sm font-medium tabular-nums text-accent">{step.n}</span>
              <div>
                <h3 className="text-base font-medium text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <figure className="mt-16 rounded-xl border border-line bg-canvas p-6 sm:p-8">
          <div className="space-y-3">
            <Bubble from="serena">
              Hola, soy Serena, la asistente de la clínica. Le voy a hacer unas pocas preguntas para completar su
              ficha. Puede contestarme con notas de voz, con toda la calma.
            </Bubble>
            <Bubble from="paciente">🎙️ Nota de voz · 0:14</Bubble>
            <Bubble from="serena">
              Perfecto, ya anoté su documento. Ahora, ¿qué medicamentos toma actualmente? Nómbrelos uno por uno.
            </Bubble>
          </div>
          <figcaption className="mt-6 text-xs text-ink-faint">
            Conversación real de onboarding, abreviada. Una pregunta por mensaje, siempre.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Bubble({ from, children }: { from: "serena" | "paciente"; children: React.ReactNode }) {
  const isSerena = from === "serena";
  return (
    <div className={isSerena ? "" : "flex justify-end"}>
      <p
        className={
          isSerena
            ? "max-w-md rounded-2xl rounded-tl-sm bg-surface px-4 py-3 text-sm leading-relaxed text-ink ring-1 ring-line ring-inset"
            : "max-w-md rounded-2xl rounded-tr-sm bg-accent-soft px-4 py-3 text-sm text-accent"
        }
      >
        {children}
      </p>
    </div>
  );
}
