import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Benefits } from "@/components/Benefits";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Pricing />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
