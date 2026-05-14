"use client";

import { useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import { vehicles } from "@/lib/fleet-data";
import type { Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
  variant?: "card" | "page";
};

type ServiceType = "airport" | "chauffeur" | "business" | "other";

export default function QuoteForm({ locale, variant = "card" }: Props) {
  const dict = t(locale);
  const tf = dict.transportForm;
  const [submitted, setSubmitted] = useState(false);
  const [service, setService] = useState<ServiceType>("airport");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const isCard = variant === "card";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={tf.title}
      className={
        isCard
          ? "glass-strong rounded-2xl p-5 sm:p-6 w-full"
          : "glass-strong rounded-2xl p-6 sm:p-8 w-full"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{tf.eyebrow}</p>
          <h2
            className={
              isCard
                ? "mt-1 font-display text-xl sm:text-2xl"
                : "mt-1 font-display text-2xl sm:text-3xl"
            }
          >
            {tf.title}
          </h2>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-gold-300">
          {tf.cardAndCash}
        </span>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-1.5 block text-[11px] uppercase tracking-widest text-white/60">
          {tf.serviceType}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              { value: "airport" as const, label: tf.serviceOptionAirport },
              { value: "chauffeur" as const, label: tf.serviceOptionChauffeur },
              { value: "business" as const, label: tf.serviceOptionBusiness },
              { value: "other" as const, label: tf.serviceOptionOther }
            ] satisfies { value: ServiceType; label: string }[]
          ).map((opt) => {
            const active = service === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                aria-pressed={active}
                onClick={() => setService(opt.value)}
                className={
                  "rounded-lg border px-2.5 py-2 text-xs transition-colors " +
                  (active
                    ? "border-gold-400 bg-gold-400/10 text-white"
                    : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="qf-pickup"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.pickup}
          </label>
          <input
            id="qf-pickup"
            name="pickup"
            type="text"
            className="glass-input"
            placeholder={tf.pickupPlaceholder}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="qf-destination"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.destination}
          </label>
          <input
            id="qf-destination"
            name="destination"
            type="text"
            className="glass-input"
            placeholder={tf.destinationPlaceholder}
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="qf-datetime"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.pickupDateTime}
          </label>
          <input
            id="qf-datetime"
            name="datetime"
            type="datetime-local"
            className="glass-input"
          />
        </div>
        <div>
          <label
            htmlFor="qf-passengers"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.passengers}
          </label>
          <input
            id="qf-passengers"
            name="passengers"
            type="number"
            min={1}
            max={8}
            className="glass-input"
            defaultValue={1}
          />
        </div>
        {service === "airport" ? (
          <div className="sm:col-span-2">
            <label
              htmlFor="qf-flight"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {tf.flightNumber}
            </label>
            <input
              id="qf-flight"
              name="flight"
              type="text"
              className="glass-input"
              placeholder="JU 401"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-white/50">{tf.flightHint}</p>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <label
            htmlFor="qf-vehicle"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.vehiclePreference}
          </label>
          <select
            id="qf-vehicle"
            name="vehicle"
            className="glass-input appearance-none"
            defaultValue=""
          >
            <option value="">{tf.vehicleAny}</option>
            {vehicles.map((v) => (
              <option key={v.slug} value={v.slug}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="qf-name"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {tf.fullName}
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
            {tf.phone}
          </label>
          <input
            id="qf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="glass-input"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-white/55">{tf.twentyFourSeven} · {tf.cardAndCash}</p>
        <button type="submit" className="btn-gold w-full sm:w-auto justify-center">
          {tf.submit}
        </button>
      </div>

      {submitted ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-200"
        >
          {tf.submitNote}
        </p>
      ) : null}
    </form>
  );
}
