import { DASHBOARD_URL, PLANS } from "./site";

export function Pricing() {
  return (
    <section id="precios" className="border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Precios claros, por clínica.</h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          Sin costo por usuario ni por paciente cargado. Se paga por onboarding completado.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.featured
                  ? "rounded-xl border-2 border-accent bg-canvas p-6"
                  : "rounded-xl border border-line bg-canvas p-6"
              }
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-base font-medium">{plan.name}</h3>
                {plan.featured && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                    Más elegido
                  </span>
                )}
              </div>

              <p className="mt-5 flex items-baseline gap-1.5">
                {plan.price === "A medida" ? (
                  <span className="text-3xl font-semibold tracking-tight">A medida</span>
                ) : (
                  <>
                    <span className="text-3xl font-semibold tracking-tight tabular-nums">€{plan.price}</span>
                    <span className="text-sm text-ink-faint">/ mes</span>
                  </>
                )}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{plan.tagline}</p>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm text-ink-soft">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={`${DASHBOARD_URL}/login`}
                className={
                  plan.featured
                    ? "mt-8 inline-flex h-10 w-full items-center justify-center rounded-md bg-ink text-sm font-medium text-white hover:bg-ink/90"
                    : "mt-8 inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-surface text-sm font-medium text-ink hover:bg-canvas"
                }
              >
                {plan.price === "A medida" ? "Hablar con ventas" : "Empezar prueba"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
