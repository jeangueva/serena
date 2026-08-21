import { FAQS } from "./site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serena.health";

/**
 * Datos estructurados para Google: ficha de producto + rich snippet de FAQ.
 * Se renderiza en el servidor, asi que el crawler lo ve en el primer HTML.
 */
export function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Serena",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web, WhatsApp",
        url: SITE_URL,
        description:
          "Serena envía el formulario de admisión por WhatsApp y deja que el paciente mayor conteste con notas de voz. La IA transcribe, extrae los datos clínicos y los entrega estructurados en un panel B2B.",
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: "49",
          highPrice: "149",
          offerCount: "3",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
