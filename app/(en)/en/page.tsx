import PageShell from "@/components/PageShell";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import FleetPreview from "@/components/FleetPreview";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import AboutTeaser from "@/components/AboutTeaser";
import ContactCTA from "@/components/ContactCTA";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  locale: "en",
  routeKey: "home",
  title: `${siteConfig.name} — ${siteConfig.tagline.en}`,
  description: siteConfig.description.en
});

export default function EnHomePage() {
  return (
    <PageShell locale="en" routeKey="home">
      <JsonLd locale="en" />
      <Hero locale="en" />
      <Categories locale="en" />
      <FleetPreview locale="en" />
      <WhyUs locale="en" />
      <HowItWorks locale="en" />
      <AboutTeaser locale="en" />
      <ContactCTA locale="en" />
    </PageShell>
  );
}
