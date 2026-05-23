import Image from "next/image";
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
            <h1
              id="hero-title"
              className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] font-black uppercase tracking-tight"
            >
              <span className="block text-white">{dict.hero.title1}</span>
              <span className="block bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 bg-clip-text text-transparent">
                {dict.hero.title2}
              </span>
            </h1>
            <div className="mt-8 mx-auto max-w-xl">
              <p className="text-sm sm:text-base uppercase tracking-[0.2em] text-white/60">
                {dict.hero.subtitle}
              </p>
              <div className="mt-4 mx-auto w-16 border-t border-white/20" aria-hidden="true" />
            </div>
            <div className="mt-10 flex justify-center">
              <ReservationTrigger className="btn-gold !px-8 !py-4 text-base sm:text-lg">
                {dict.hero.ctaPrimary}
              </ReservationTrigger>
            </div>
        </div>
      </div>
    </section>
  );
}
