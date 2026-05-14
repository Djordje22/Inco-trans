"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Globe, Check, ChevronDown } from "lucide-react";
import Flag from "./icons/Flag";
import {
  siteConfig,
  localeLabels,
  localeNames,
  routeMap,
  type Locale,
  type RouteKey
} from "@/lib/site-config";

type Props = {
  current: Locale;
  routeKey: RouteKey;
};

export default function LanguageSwitcher({ current, routeKey }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

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

  const triggerLabel =
    current === "sr"
      ? "Promena jezika"
      : current === "ru"
        ? "Сменить язык"
        : "Change language";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10"
      >
        <Globe className="h-4 w-4 text-white/85" aria-hidden="true" />
        <Flag locale={current} className="h-[14px] w-[18px] rounded-sm object-cover" />
        <span className="hidden sm:inline">{localeLabels[current]}</span>
        <ChevronDown
          className={
            "h-3 w-3 text-white/60 transition-transform " +
            (open ? "rotate-180" : "")
          }
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 min-w-[180px] glass-strong rounded-xl p-1 shadow-glass"
        >
          {siteConfig.locales.map((loc) => {
            const active = loc === current;
            return (
              <li key={loc} role="none">
                <Link
                  href={routeMap[routeKey][loc]}
                  role="menuitem"
                  hrefLang={loc}
                  aria-current={active ? "true" : undefined}
                  onClick={() => setOpen(false)}
                  className={
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors " +
                    (active
                      ? "bg-white/8 text-white"
                      : "text-white/80 hover:bg-white/8 hover:text-white")
                  }
                >
                  <Flag locale={loc} />
                  <span className="flex-1">{localeNames[loc]}</span>
                  <span className="text-[11px] uppercase tracking-widest text-white/45">
                    {localeLabels[loc]}
                  </span>
                  {active ? (
                    <Check
                      className="h-3.5 w-3.5 text-gold-300 shrink-0"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
