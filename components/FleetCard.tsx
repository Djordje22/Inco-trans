import Image from "next/image";
import { type Vehicle, pricePlaceholder } from "@/lib/fleet-data";
import { type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import { ReservationTrigger } from "./ReservationModal";

type Props = {
  vehicle: Vehicle;
  locale: Locale;
};

export default function FleetCard({ vehicle, locale }: Props) {
  const dict = t(locale);
  const altText =
    locale === "sr"
      ? `${vehicle.name} vozilo iz Inco Trans flote sa profesionalnim šoferom`
      : locale === "ru"
        ? `${vehicle.name} автомобиль Inco Trans с профессиональным шофёром`
        : `${vehicle.name} Inco Trans vehicle with professional chauffeur`;

  return (
    <article className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-ink-800">
        <Image
          src={vehicle.image}
          alt={altText}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      <div className="p-6 flex flex-1 flex-col">
        <h3 className="font-display text-xl text-white">{vehicle.name}</h3>
        <p className="mt-1 text-sm text-white/65">{vehicle.tagline[locale]}</p>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-white/65">
          <div className="flex items-center justify-between">
            <dt>{dict.fleetCard.passengers}</dt>
            <dd className="text-white/90 font-medium">{vehicle.passengers}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{dict.fleetCard.luggage}</dt>
            <dd className="text-white/90 font-medium">{vehicle.luggage}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{dict.fleetCard.transmission}</dt>
            <dd className="text-white/90 font-medium">
              {vehicle.transmission[locale]}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>{dict.fleetCard.fuel}</dt>
            <dd className="text-white/90 font-medium">{vehicle.fuel[locale]}</dd>
          </div>
        </dl>

        <ul className="mt-5 space-y-1.5 text-sm text-white/75">
          {vehicle.comfort[locale].map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 rounded-[1px] bg-gold-400"
              />
              <span>{c}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <span className="text-sm font-semibold text-gold-300">
            {pricePlaceholder(locale)}
          </span>
          <div className="flex items-center gap-2">
            <ReservationTrigger className="btn-gold !py-2 !px-3 text-xs">
              {dict.fleetCard.reserve}
            </ReservationTrigger>
          </div>
        </div>
      </div>
    </article>
  );
}
