"use client";

import { useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function ContactForm({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const companyDict = dict.modal.contact;
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitState("submitting");

    const form = new FormData(e.currentTarget);
    const response = await fetch("/api/contact-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        source: "contact_page",
        fullName: String(form.get("fullName") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        companyName: String(form.get("companyName") ?? ""),
        companyVatNumber: String(form.get("companyVatNumber") ?? ""),
        companyAddress: String(form.get("companyAddress") ?? ""),
        message: String(form.get("message") ?? "")
      })
    });

    setSubmitState(response.ok ? "success" : "error");
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={dict.contact.formTitle}
      className="glass-strong rounded-2xl p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl">{dict.contact.formTitle}</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="cf-name"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.contact.fullName}
          </label>
          <input
            id="cf-name"
            name="fullName"
            type="text"
            autoComplete="name"
            className="glass-input"
          />
        </div>
        <div>
          <label
            htmlFor="cf-email"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.contact.email}
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autoComplete="email"
            className="glass-input"
          />
        </div>
        <div>
          <label
            htmlFor="cf-phone"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.contact.phone}
          </label>
          <input
            id="cf-phone"
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
                htmlFor="cf-company-name"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyName}
              </label>
              <input
                id="cf-company-name"
                name="companyName"
                type="text"
                autoComplete="organization"
                className="glass-input"
                placeholder={companyDict.companyNamePlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="cf-company-vat"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyVatNumber}
              </label>
              <input
                id="cf-company-vat"
                name="companyVatNumber"
                type="text"
                className="glass-input"
                placeholder={companyDict.companyVatNumberPlaceholder}
              />
            </div>
            <div>
              <label
                htmlFor="cf-company-address"
                className="mb-1.5 block text-xs font-medium text-white/70"
              >
                {companyDict.companyAddress}
              </label>
              <input
                id="cf-company-address"
                name="companyAddress"
                type="text"
                autoComplete="street-address"
                className="glass-input"
                placeholder={companyDict.companyAddressPlaceholder}
              />
            </div>
          </div>
        </section>
        <div className="sm:col-span-2">
          <label
            htmlFor="cf-message"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.contact.message}
          </label>
          <textarea
            id="cf-message"
            name="message"
            rows={5}
            className="glass-input resize-none"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/55">{dict.contact.submitNote}</p>
        <button type="submit" className="btn-gold w-full sm:w-auto justify-center">
          {submitState === "submitting" ? "..." : dict.contact.submit}
        </button>
      </div>

      {submitState === "success" ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-200"
        >
          {dict.contact.submitNote}
        </p>
      ) : null}
      {submitState === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-100"
        >
          We could not send the message. Please try WhatsApp or phone.
        </p>
      ) : null}
    </form>
  );
}
