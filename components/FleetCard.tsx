import Image from "next/image";
import { formatPrice, type Vehicle } from "@/lib/fleet-data";
import { type Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import { ReservationTrigger } from "./ReservationModal";

type Props = {
  vehicle: Vehicle;
  locale: Locale;
};

export default function FleetCard({ vehicle, locale }: Props) {
  const dict = t(locale);
  const price = formatPrice(vehicle, locale, dict.fleetCard.pricePlaceholder);
  const altText =
    locale === "sr"
      ? `${vehicle.name} — primer vozila iz Inco Trans flote`
      : `${vehicle.name} — example vehicle from the Inco Trans fleet`;

  return (
    <article className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-ink-800">
        <Image
          src={vehicle.image}
          alt={altText}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/10 bg-ink-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
          {vehicle.category}
        </span>
      </div>

      <div className="p-5 flex flex-1 flex-col">
        <h3 className="font-display text-lg text-white">{vehicle.name}</h3>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-white/65">
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

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-white/45">
              {dict.fleetCard.perDay}
            </p>
            <p className="text-base font-semibold text-gold-300">{price}</p>
          </div>
          <ReservationTrigger className="btn-ghost !py-2 !px-3 text-xs">
            {dict.fleetCard.reserve}
          </ReservationTrigger>
        </div>
      </div>
    </article>
  );
}
