import Image from "next/image";
import { Clock, CreditCard } from "lucide-react";
import { t } from "@/lib/i18n";
import { type Locale } from "@/lib/site-config";
import { ReservationTrigger } from "./ReservationModal";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=80";

export default function Hero({ locale }: { locale: Locale }) {
  const dict = t(locale);

  return (
    <section
      className="relative isolate overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 -z-20">
        <Image
          src={HERO_IMAGE}
          alt={
            locale === "sr"
              ? "Luksuzni automobil, Inco Trans transfer servis u Beogradu"
              : locale === "ru"
                ? "Люксовый автомобиль, трансфер Inco Trans в Белграде"
                : "Luxury car, Inco Trans transfer service in Belgrade"
          }
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-hero-fade" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-radial-gold" aria-hidden="true" />

      <div className="container-tight min-h-[calc(100svh-5rem)] pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-28 md:pb-32 flex items-center justify-center">
        <div className="animate-fade-up mx-auto max-w-5xl text-center">
            <span className="eyebrow">{dict.hero.eyebrow}</span>
            <h1
              id="hero-title"
              className="mt-4 font-display text-4xl sm:text-6xl md:text-7xl leading-tight"
            >
              <span className="block text-white">{dict.hero.title1}</span>
              <span className="block bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 bg-clip-text text-transparent">
                {dict.hero.title2}
              </span>
            </h1>
            <p className="mt-5 mx-auto max-w-2xl text-base sm:text-lg text-white/75">
              {dict.hero.subtitle}
            </p>
            <ul className="mt-7 flex flex-wrap justify-center gap-2 text-[11px] uppercase tracking-widest text-white/70">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
                {dict.badges.hours247}
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1">
                <CreditCard
                  className="h-3.5 w-3.5 text-gold-300"
                  aria-hidden="true"
                />
                {dict.badges.cashAndCard}
              </li>
            </ul>
            <div className="mt-9 flex justify-center">
              <ReservationTrigger className="btn-gold !px-8 !py-4 text-base sm:text-lg">
                {dict.hero.ctaPrimary}
              </ReservationTrigger>
            </div>
        </div>
      </div>
    </section>
  );
}
