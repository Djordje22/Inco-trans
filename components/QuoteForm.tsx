"use client";

import { useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import { categoryLabels, type VehicleCategory } from "@/lib/fleet-data";
import type { Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
  variant?: "card" | "page";
};

const CATEGORIES: VehicleCategory[] = ["sedan", "suv", "sport", "van"];

export default function QuoteForm({ locale, variant = "card" }: Props) {
  const dict = t(locale);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const isCard = variant === "card";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={dict.quoteCard.title}
      className={
        isCard
          ? "glass-strong rounded-2xl p-5 sm:p-6 w-full"
          : "glass-strong rounded-2xl p-6 sm:p-8 w-full"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{dict.hero.eyebrow}</p>
          <h2
            className={
              isCard
                ? "mt-1 font-display text-xl sm:text-2xl"
                : "mt-1 font-display text-2xl sm:text-3xl"
            }
          >
            {dict.quoteCard.title}
          </h2>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold-300">
          {dict.quoteCard.cashOnly}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="qf-pickup"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.pickup}
          </label>
          <input
            id="qf-pickup"
            name="pickup"
            type="date"
            className="glass-input"
            aria-label={dict.quoteCard.pickup}
          />
        </div>
        <div>
          <label
            htmlFor="qf-return"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.return}
          </label>
          <input
            id="qf-return"
            name="return"
            type="date"
            className="glass-input"
            aria-label={dict.quoteCard.return}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="qf-vehicle"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.vehicle}
          </label>
          <select
            id="qf-vehicle"
            name="vehicle"
            className="glass-input appearance-none"
            defaultValue=""
          >
            <option value="">{dict.quoteCard.vehicleAny}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c][locale]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="qf-name"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.name}
          </label>
          <input
            id="qf-name"
            name="name"
            type="text"
            autoComplete="name"
            className="glass-input"
          />
        </div>
        <div>
          <label
            htmlFor="qf-phone"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.phone}
          </label>
          <input
            id="qf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="glass-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="qf-message"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.quoteCard.message}
          </label>
          <textarea
            id="qf-message"
            name="message"
            rows={isCard ? 2 : 4}
            className="glass-input resize-none"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-white/55 sm:hidden">
          {dict.quoteCard.cashOnly}
        </p>
        <p className="text-xs text-white/55">{dict.quoteCard.submitNote}</p>
        <button type="submit" className="btn-gold w-full sm:w-auto justify-center">
          {dict.quoteCard.submit}
        </button>
      </div>

      {submitted ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-200"
        >
          {dict.quoteCard.submitNote}
        </p>
      ) : null}
    </form>
  );
}
