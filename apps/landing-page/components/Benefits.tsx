const BENEFITS = [
  {
    title: "El paciente no aprende nada nuevo",
    body: "Ya sabe mandar audios. Esa es toda la curva de aprendizaje. Ni apps, ni links, ni contraseñas, ni letra chica en un PDF.",
  },
  {
    title: "La recepción deja de transcribir",
    body: "Se acabó el teléfono en el hombro anotando dosis a mano. La ficha llega estructurada y solo hay que revisarla.",
  },
  {
    title: "Paciencia infinita, de verdad",
    body: "Serena repite la pregunta las veces que haga falta, sin suspiros ni prisa. Un paciente que no se siente torpe es un paciente que termina la ficha.",
  },
  {
    title: "Las alergias no se pierden",
    body: "El panel pone primero lo que evita un daño: alergias y medicación actual, arriba de todo y siempre visibles.",
  },
  {
    title: "Cada clínica ve solo lo suyo",
    body: "El aislamiento por organización está impuesto en la base de datos, no en la pantalla. Una consulta mal escrita no puede filtrar datos de otra clínica.",
  },
  {
    title: "Se nota lo que falta",
    body: "Un campo sin responder se muestra como “falta preguntar”, nunca como un vacío ambiguo. Sabés exactamente dónde quedó cada ficha.",
  },
] as const;

export function Benefits() {
  return (
    <section id="beneficios" className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
        Diseñada alrededor de la persona que más cuesta digitalizar.
      </h2>

      <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {BENEFITS.map((item) => (
          <div key={item.title}>
            <h3 className="text-base font-medium text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
