import { FAQS } from "./site";

export function Faq() {
  return (
    <section id="preguntas" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Preguntas que nos hacen siempre.</h2>

      <dl className="mt-10 divide-y divide-line border-y border-line">
        {FAQS.map((item) => (
          <div key={item.q} className="py-6">
            <dt className="text-base font-medium text-ink">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
