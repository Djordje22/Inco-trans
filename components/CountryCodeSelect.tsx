"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export const PHONE_COUNTRY_CODES = [
  { code: "+381", flag: "\u{1F1F7}\u{1F1F8}", name: "Serbia" },
  { code: "+1", flag: "\u{1F1FA}\u{1F1F8}", name: "United States" },
  { code: "+44", flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom" },
  { code: "+49", flag: "\u{1F1E9}\u{1F1EA}", name: "Germany" },
  { code: "+33", flag: "\u{1F1EB}\u{1F1F7}", name: "France" },
  { code: "+39", flag: "\u{1F1EE}\u{1F1F9}", name: "Italy" },
  { code: "+34", flag: "\u{1F1EA}\u{1F1F8}", name: "Spain" },
  { code: "+7", flag: "\u{1F1F7}\u{1F1FA}", name: "Russia" },
  { code: "+971", flag: "\u{1F1E6}\u{1F1EA}", name: "United Arab Emirates" },
  { code: "+90", flag: "\u{1F1F9}\u{1F1F7}", name: "Turkey" },
  { code: "+43", flag: "\u{1F1E6}\u{1F1F9}", name: "Austria" },
  { code: "+41", flag: "\u{1F1E8}\u{1F1ED}", name: "Switzerland" },
  { code: "+31", flag: "\u{1F1F3}\u{1F1F1}", name: "Netherlands" },
  { code: "+32", flag: "\u{1F1E7}\u{1F1EA}", name: "Belgium" },
  { code: "+30", flag: "\u{1F1EC}\u{1F1F7}", name: "Greece" },
  { code: "+385", flag: "\u{1F1ED}\u{1F1F7}", name: "Croatia" },
  { code: "+386", flag: "\u{1F1F8}\u{1F1EE}", name: "Slovenia" },
  { code: "+382", flag: "\u{1F1F2}\u{1F1EA}", name: "Montenegro" },
  { code: "+387", flag: "\u{1F1E7}\u{1F1E6}", name: "Bosnia and Herzegovina" },
  { code: "+389", flag: "\u{1F1F2}\u{1F1F0}", name: "North Macedonia" },
  { code: "+355", flag: "\u{1F1E6}\u{1F1F1}", name: "Albania" },
  { code: "+359", flag: "\u{1F1E7}\u{1F1EC}", name: "Bulgaria" },
  { code: "+40", flag: "\u{1F1F7}\u{1F1F4}", name: "Romania" },
  { code: "+36", flag: "\u{1F1ED}\u{1F1FA}", name: "Hungary" },
  { code: "+420", flag: "\u{1F1E8}\u{1F1FF}", name: "Czech Republic" },
  { code: "+48", flag: "\u{1F1F5}\u{1F1F1}", name: "Poland" },
  { code: "+61", flag: "\u{1F1E6}\u{1F1FA}", name: "Australia" },
  { code: "+1", flag: "\u{1F1E8}\u{1F1E6}", name: "Canada" },
  { code: "+86", flag: "\u{1F1E8}\u{1F1F3}", name: "China" },
  { code: "+81", flag: "\u{1F1EF}\u{1F1F5}", name: "Japan" }
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
};

export default function CountryCodeSelect({ value, onChange, ariaLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected =
    PHONE_COUNTRY_CODES.find((item) => item.code === value) ?? PHONE_COUNTRY_CODES[0];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? PHONE_COUNTRY_CODES.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.code.includes(normalizedQuery) ||
          item.flag.includes(normalizedQuery)
      )
    : PHONE_COUNTRY_CODES;

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-32 shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((next) => !next);
          setQuery("");
        }}
        className="glass-input flex w-full items-center justify-between gap-1 px-2.5 text-left"
      >
        <span className="min-w-0 truncate">
          {selected.flag} {selected.code}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-[min(90vw,22rem)] overflow-hidden rounded-xl border border-white/12 bg-ink-900 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-white/45" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              autoFocus
            />
          </div>
          <div role="listbox" className="max-h-80 overflow-y-auto py-1">
            {filtered.map((item) => {
              const active = item.code === value;
              return (
                <button
                  key={`${item.name}-${item.code}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(item.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors " +
                    (active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/[0.07]")
                  }
                >
                  <span className="w-7 text-center text-sm">{active ? "\u2713" : item.flag}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-white/55">
                    {item.code}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
