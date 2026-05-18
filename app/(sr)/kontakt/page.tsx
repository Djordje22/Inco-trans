import PageShell from "@/components/PageShell";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import JsonLd from "@/components/JsonLd";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";
import { siteConfig } from "@/lib/site-config";

const locale = "sr" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "contact",
  title: dict.contact.title,
  description: dict.contact.subtitle
});

export default function KontaktPage() {
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
                  <span className="text-white/55 mr-2">
                    {dict.contact.whatsappLabel}:
                  </span>
                  <span className="text-white/90">{siteConfig.contact.whatsapp}</span>
                </li>
                <li>
                  <span className="text-white/55 mr-2">Tel:</span>
                  <span className="text-white/90">{siteConfig.contact.phone}</span>
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
                    {siteConfig.contact.hours.sr}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
