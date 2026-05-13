"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
  links: { href: string; label: string }[];
};

export default function MobileMenu({ locale, links }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const labelOpen = locale === "sr" ? "Otvori meni" : "Open menu";
  const labelClose = locale === "sr" ? "Zatvori meni" : "Close menu";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labelOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={locale === "sr" ? "Navigacija" : "Navigation"}
          className="fixed inset-0 z-[60] md:hidden"
        >
          <button
            type="button"
            aria-label={labelClose}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-x-3 top-3 glass-strong rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg">
                {locale === "sr" ? "Meni" : "Menu"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labelClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
            <ul className="mt-4 flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base text-white/85 hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
