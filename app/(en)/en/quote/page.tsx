import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import QuoteForm from "@/components/QuoteForm";
import JsonLd from "@/components/JsonLd";
import WhatsAppButton from "@/components/WhatsAppButton";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

const locale = "en" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "quote",
  title: dict.quotePage.title,
  description: dict.quotePage.subtitle
});

export default function QuotePage() {
  return (
    <PageShell locale={locale} routeKey="quote">
      <JsonLd locale={locale} />
      <PageHero
        eyebrow={dict.nav.quote}
        title={dict.quotePage.title}
        subtitle={dict.quotePage.subtitle}
      />
      <section className="container-tight pb-16 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <QuoteForm locale={locale} variant="page" />

          <aside className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl text-white">
              {dict.quotePage.detailsTitle}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              {dict.quotePage.notes.map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-gold-400"
                  />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <div className="hairline my-6" />
            <div className="text-sm text-white/65 space-y-2">
              <p>
                <span className="text-white/80 font-medium">Phone: </span>
                {siteConfig.contact.phone}
              </p>
              <p>
                <span className="text-white/80 font-medium">WhatsApp: </span>
                {siteConfig.contact.whatsapp}
              </p>
              <p>
                <span className="text-white/80 font-medium">Email: </span>
                {siteConfig.contact.email}
              </p>
            </div>
            <div className="mt-6">
              <WhatsAppButton label={dict.hero.whatsappCta} />
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
