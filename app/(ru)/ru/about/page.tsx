import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ContactCTA from "@/components/ContactCTA";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "ru" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "about",
  title: dict.about.title,
  description: dict.about.body[0]
});

export default function RuAboutPage() {
  return (
    <PageShell locale={locale} routeKey="about">
      <JsonLd locale={locale} />
      <PageHero eyebrow={dict.nav.about} title={dict.about.title} />
      <section className="container-tight pb-16 sm:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="glass-strong rounded-2xl p-6 sm:p-10">
            <div className="space-y-5 text-base sm:text-lg text-white/80">
              {dict.about.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          <aside className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl text-white">
              {dict.about.valuesTitle}
            </h2>
            <ul className="mt-4 space-y-2">
              {dict.about.values.map((v) => (
                <li
                  key={v}
                  className="flex items-start gap-2 text-sm text-white/75"
                >
                  <span aria-hidden="true" className="mt-1 text-gold-400">◆</span>
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
      <ContactCTA locale={locale} />
    </PageShell>
  );
}
