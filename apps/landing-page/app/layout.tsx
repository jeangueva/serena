import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://serena.health";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Serena · La asistente de voz que digitaliza tu clínica sin frustrar a tus pacientes mayores",
    template: "%s · Serena",
  },
  description:
    "Serena envía el formulario de admisión por WhatsApp y deja que el paciente conteste con notas de voz. La IA transcribe, extrae los datos clínicos y los deja listos en tu panel. Sin formularios, sin llamadas, sin planillas.",
  keywords: [
    "onboarding de pacientes",
    "admisión digital clínica",
    "formularios por WhatsApp",
    "IA para clínicas",
    "silver economy",
    "adultos mayores",
    "notas de voz a datos",
  ],
  authors: [{ name: "Serena" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "Serena",
    title: "Serena · Onboarding de pacientes mayores por WhatsApp",
    description:
      "Tus pacientes contestan hablando. Serena escucha, entiende y llena la ficha clínica por vos.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Serena · Onboarding de pacientes mayores por WhatsApp",
    description: "Tus pacientes contestan hablando. Serena llena la ficha clínica por vos.",
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
