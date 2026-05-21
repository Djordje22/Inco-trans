"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  clampBookingCount,
  MAX_LUGGAGE,
  MAX_PASSENGERS,
  MIN_LUGGAGE,
  MIN_PASSENGERS
} from "@/lib/booking-constraints";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";

type Props = {
  locale: Locale;
  variant?: "card" | "page";
};

type ServiceType = "airport" | "chauffeur" | "business" | "other";
type SubmitState = "idle" | "submitting" | "success" | "error";

function addHoursToDateTimeLocal(value: string, hours: number): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setHours(date.getHours() + hours);
  const pad = (next: number) => (next < 10 ? `0${next}` : String(next));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function QuoteForm({ locale, variant = "card" }: Props) {
  const dict = t(locale);
  const tf = dict.transportForm;
  const companyDict = dict.modal.contact;
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [service, setService] = useState<ServiceType>("airport");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState("submitting");

    const form = new FormData(e.currentTarget);
    const dateTime = String(form.get("datetime") ?? "");
    const response = await fetch("/api/booking-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        source: "quote_form",
        service,
        pickup: String(form.get("pickup") ?? ""),
        destination: String(form.get("destination") ?? ""),
        dateTime,
        ...(service === "chauffeur"
          ? {
              dropoffDateTime: addHoursToDateTimeLocal(dateTime, 4),
              chauffeurDurationHours: 4
            }
          : {}),
        passengers: Number(form.get("passengers") ?? MIN_PASSENGERS),
        luggage: Number(form.get("luggage") ?? MIN_LUGGAGE),
        flight: String(form.get("flight") ?? ""),
        fullName: String(form.get("name") ?? ""),
        phone: String(form.get("phone") ?? ""),
        companyName: String(form.get("companyName") ?? ""),
        companyVatNumber: String(form.get("companyVatNumber") ?? ""),
        companyAddress: String(form.get("companyAddress") ?? ""),
        paymentMethod: "cash"
      })
    });

    setSubmitState(response.ok ? "success" : "error");
  };

  const enforceCount = (
    e: ChangeEvent<HTMLInputElement>,
    min: number,
    max: number
  ) => {
    if (e.currentTarget.value === "") return;
    e.currentTarget.value = String(
      clampBookingCount(Number(e.currentTarget.value), min, max)
    );
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
        <div className="sm:col-span-2">
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
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
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
              min={MIN_PASSENGERS}
              max={MAX_PASSENGERS}
              className="glass-input"
              defaultValue={MIN_PASSENGERS}
              onChange={(e) => enforceCount(e, MIN_PASSENGERS, MAX_PASSENGERS)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="qf-luggage"
              className="mb-1.5 block text-xs font-medium text-white/70"
            >
              {tf.luggage}
            </label>
            <input
              id="qf-luggage"
              name="luggage"
              type="number"
              min={MIN_LUGGAGE}
              max={MAX_LUGGAGE}
              className="glass-input"
              defaultValue={MIN_LUGGAGE}
              onChange={(e) => enforceCount(e, MIN_LUGGAGE, MAX_LUGGAGE)}
              required
            />
          </div>
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
        <section className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <h3 className="font-display text-xl text-white">
            {companyDict.companyInformationTitle}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="qf-company-name"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyName}
              </label>
              <input
                id="qf-company-name"
                name="companyName"
                type="text"
                autoComplete="organization"
                className="glass-input"
                placeholder={companyDict.companyNamePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="qf-company-vat"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyVatNumber}
              </label>
              <input
                id="qf-company-vat"
                name="companyVatNumber"
                type="text"
                className="glass-input"
                placeholder={companyDict.companyVatNumberPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="qf-company-address"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyAddress}
              </label>
              <input
                id="qf-company-address"
                name="companyAddress"
                type="text"
                autoComplete="street-address"
                className="glass-input"
                placeholder={companyDict.companyAddressPlaceholder}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-white/55">{tf.twentyFourSeven} · {tf.cardAndCash}</p>
        <button type="submit" className="btn-gold w-full sm:w-auto justify-center">
          {submitState === "submitting" ? "..." : tf.submit}
        </button>
      </div>

      {submitState === "success" ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-200"
        >
          {tf.submitNote}
        </p>
      ) : null}
      {submitState === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100"
        >
          We could not send the request. Please try WhatsApp or phone.
        </p>
      ) : null}
    </form>
  );
}
