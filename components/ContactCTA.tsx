import Link from "next/link";
import { siteConfig, routeMap, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import { ReservationTrigger } from "./ReservationModal";

export default function ContactCTA({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="cta-title"
    >
      <div className="glass-strong rounded-3xl p-8 sm:p-12 text-center">
        <p className="eyebrow">{siteConfig.contact.city}</p>
        <h2
          id="cta-title"
          className="mt-2 font-display text-3xl sm:text-4xl text-white"
        >
          {locale === "sr"
            ? "Spremni za sledeću vožnju?"
            : "Ready for your next drive?"}
        </h2>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">
          {locale === "sr"
            ? "Zatraži ponudu — javljamo se sa dostupnim vozilima i jasnim uslovima."
            : "Request a quote — we will reply with available vehicles and clear terms."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ReservationTrigger>{dict.nav.requestQuote}</ReservationTrigger>
          <Link href={routeMap.contact[locale]} className="btn-ghost">
            {dict.nav.contact}
          </Link>
        </div>
      </div>
    </section>
  );
}
