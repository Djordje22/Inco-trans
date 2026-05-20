"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  PlaneLanding,
  CarTaxiFront,
  Route,
  ChevronDown
} from "lucide-react";
import { routeMap, type Locale } from "@/lib/site-config";
import { t, type ServiceKey } from "@/lib/i18n";

type Props = { locale: Locale };

const ICONS = {
  airport: PlaneLanding,
  chauffeur: CarTaxiFront,
  business: Route
} as const;

const ROUTE_KEY: Record<ServiceKey, keyof typeof routeMap> = {
  airport: "airportTransfer",
  chauffeur: "chauffeurService",
  business: "businessTransfer"
};

export default function NavServicesMenu({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dict = t(locale);
  const order: ServiceKey[] = ["airport", "chauffeur", "business"];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-2 text-[13px] text-white/75 hover:text-white transition-colors"
      >
        {dict.nav.services}
        <ChevronDown
          aria-hidden="true"
          className={
            "h-3.5 w-3.5 text-white/55 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-40 mt-2 w-[320px] -translate-x-1/2 glass-strong rounded-xl p-2 shadow-glass"
        >
          <ul className="space-y-1">
            {order.map((key) => {
              const Icon = ICONS[key];
              const item = dict.services.items[key];
              const href = routeMap[ROUTE_KEY[key]][locale];
              return (
                <li key={key} role="none">
                  <Link
                    href={href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_14px_30px_rgba(0,0,0,0.28)] focus-visible:-translate-y-0.5 focus-visible:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/45"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-400/25 group-hover:text-gold-200 group-hover:ring-gold-300/60">
                      <Icon
                        className="h-4 w-4 transition-transform duration-300 group-hover:rotate-6"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-white transition-colors group-hover:text-gold-100">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/55 line-clamp-2 transition-colors group-hover:text-white/75">
                        {item.desc}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
