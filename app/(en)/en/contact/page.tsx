import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

const locale = "en" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "contact",
  title: dict.contact.title,
  description: dict.contact.subtitle
});

export default function ContactPage() {
  return (
    <PageShell locale={locale} routeKey="contact">
      <JsonLd locale={locale} />
      <PageHero
        eyebrow={dict.nav.contact}
        title={dict.contact.title}
        subtitle={dict.contact.subtitle}
      />
      <section className="container-tight pb-16 sm:pb-20">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <ContactForm locale={locale} />

          <aside className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="eyebrow">{dict.footer.contact}</h2>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <span className="text-white/55 mr-2">Phone:</span>
                  <span className="text-white/90">{siteConfig.contact.phone}</span>
                </li>
                <li>
                  <span className="text-white/55 mr-2">WhatsApp:</span>
                  <span className="text-white/90">{siteConfig.contact.whatsapp}</span>
                </li>
                <li>
                  <span className="text-white/55 mr-2">Email:</span>
                  <span className="text-white/90">{siteConfig.contact.email}</span>
                </li>
                <li>
                  <span className="text-white/55 mr-2">
                    {dict.contact.addressLabel}:
                  </span>
                  <span className="text-white/90">{siteConfig.contact.address}</span>
                </li>
                <li>
                  <span className="text-white/55 mr-2">
                    {dict.contact.hoursLabel}:
                  </span>
                  <span className="text-white/90">
                    {siteConfig.contact.hours.en}
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <div
                role="img"
                aria-label={dict.contact.mapPlaceholder}
                className="aspect-[16/10] bg-gradient-to-br from-ink-800 via-ink-700 to-ink-900 flex items-center justify-center text-sm text-white/55"
              >
                {dict.contact.mapPlaceholder}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
