import Link from "next/link";
import { routeMap, type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import { ReservationTrigger } from "./ReservationModal";
import WhatsAppButton from "./WhatsAppButton";

export default function ContactCTA({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="container-tight py-16 sm:py-20"
      aria-labelledby="cta-title"
    >
      <div className="glass-strong rounded-3xl p-8 sm:p-12 text-center">
        <p className="eyebrow">{dict.badges.hours247}</p>
        <h2
          id="cta-title"
          className="mt-2 font-display text-3xl sm:text-4xl text-white"
        >
          {dict.cta.readyTitle}
        </h2>
        <p className="mt-3 text-white/70 max-w-xl mx-auto">
          {dict.cta.readyBody}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <WhatsAppButton label={dict.hero.whatsappCta} />
          <ReservationTrigger variant="ghost">
            {dict.nav.requestQuote}
          </ReservationTrigger>
          <Link href={routeMap.contact[locale]} className="btn-ghost">
            {dict.nav.contact}
          </Link>
        </div>
      </div>
    </section>
  );
}
