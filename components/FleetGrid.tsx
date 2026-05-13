"use client";

import { useMemo, useState } from "react";
import {
  categoryLabels,
  vehicles,
  type VehicleCategory
} from "@/lib/fleet-data";
import type { Locale } from "@/lib/site-config";
import { t } from "@/lib/i18n";
import FleetCard from "./FleetCard";

type Filter = VehicleCategory | "all";

export default function FleetGrid({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? vehicles : vehicles.filter((v) => v.category === filter)),
    [filter]
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: dict.fleetPage.filterAll },
    { key: "sedan", label: categoryLabels.sedan[locale] },
    { key: "suv", label: categoryLabels.suv[locale] },
    { key: "sport", label: categoryLabels.sport[locale] },
    { key: "van", label: categoryLabels.van[locale] }
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label={locale === "sr" ? "Filtri klasa" : "Class filters"}
        className="flex flex-wrap gap-2"
      >
        {filters.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={
                "rounded-full px-4 py-2 text-sm transition-colors border " +
                (active
                  ? "bg-gold-400 text-ink-900 border-gold-400"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 glass rounded-2xl p-6 text-center text-white/65">
          {dict.fleetPage.empty}
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <FleetCard key={v.slug} vehicle={v} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
