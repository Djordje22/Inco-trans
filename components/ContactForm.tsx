"use client";

import { useState, type FormEvent } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";

export default function ContactForm({ locale }: { locale: Locale }) {
  const dict = t(locale);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
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
            type="tel"
            autoComplete="tel"
            className="glass-input"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="cf-message"
            className="mb-1.5 block text-xs font-medium text-white/70"
          >
            {dict.contact.message}
          </label>
          <textarea id="cf-message" rows={5} className="glass-input resize-none" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/55">{dict.contact.submitNote}</p>
        <button type="submit" className="btn-gold w-full sm:w-auto justify-center">
          {dict.contact.submit}
        </button>
      </div>

      {submitted ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-xs text-gold-200"
        >
          {dict.contact.submitNote}
        </p>
      ) : null}
    </form>
  );
}
