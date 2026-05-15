import PageHero from "./PageHero";
import PageShell from "./PageShell";
import JsonLd from "./JsonLd";
import type { Locale, RouteKey } from "@/lib/site-config";

type LegalSection = {
  title: string;
  body: string[];
};

type Props = {
  locale: Locale;
  routeKey: Extract<RouteKey, "terms" | "privacy">;
  title: string;
  subtitle: string;
  sections: LegalSection[];
};

export default function LegalPage({
  locale,
  routeKey,
  title,
  subtitle,
  sections
}: Props) {
  return (
    <PageShell locale={locale} routeKey={routeKey}>
      <JsonLd locale={locale} />
      <PageHero eyebrow="Inco Trans" title={title} subtitle={subtitle} />
      <section className="container-tight pb-16 sm:pb-20">
        <div className="glass-strong rounded-2xl p-6 sm:p-10">
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl text-white">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/72 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
