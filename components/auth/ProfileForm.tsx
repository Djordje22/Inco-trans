"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import CountryCodeSelect from "@/components/CountryCodeSelect";
import type { Dict } from "@/lib/i18n";
import type { Locale } from "@/lib/site-config";
import { routeMap } from "@/lib/site-config";

type Props = {
  locale: Locale;
  dict: Dict;
};

type ProfileData = {
  first_name: string;
  last_name: string;
  email: string;
  phone_country_code: string;
  phone: string;
  company_name: string;
  company_vat_number: string;
  company_address: string;
};

const empty: ProfileData = {
  first_name: "",
  last_name: "",
  email: "",
  phone_country_code: "",
  phone: "",
  company_name: "",
  company_vat_number: "",
  company_address: ""
};

export default function ProfileForm({ locale, dict }: Props) {
  const [profile, setProfile] = useState<ProfileData>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = routeMap.login[locale];
        return;
      }

      // Try to fetch profile — gracefully handle missing columns
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone_country_code, phone, company_name, company_vat_number, company_address")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile({
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          email: data.email ?? user.email ?? "",
          phone_country_code: data.phone_country_code ?? "",
          phone: data.phone ?? "",
          company_name: data.company_name ?? "",
          company_vat_number: data.company_vat_number ?? "",
          company_address: data.company_address ?? ""
        });
      } else if (fetchError) {
        // Columns may not exist yet — fall back to auth user email
        setProfile({ ...empty, email: user.email ?? "" });
      }
      setLoading(false);
    };
    load();
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);

    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name.trim() || null,
        last_name: profile.last_name.trim() || null,
        full_name: [profile.first_name.trim(), profile.last_name.trim()].filter(Boolean).join(" ") || null,
        phone_country_code: profile.phone_country_code.trim() || null,
        phone: profile.phone.trim() || null,
        company_name: profile.company_name.trim() || null,
        company_vat_number: profile.company_vat_number.trim() || null,
        company_address: profile.company_address.trim() || null
      })
      .eq("id", user.id);

    if (updateError) {
      setError(dict.auth.genericError);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const update = (field: keyof ProfileData, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  if (loading) {
    return <div className="py-8 text-center text-white/50">...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm text-white/70 mb-1">
            {dict.auth.firstName}
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            value={profile.first_name}
            onChange={(e) => update("first_name", e.target.value)}
            className="glass-input w-full"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm text-white/70 mb-1">
            {dict.auth.lastName}
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            value={profile.last_name}
            onChange={(e) => update("last_name", e.target.value)}
            className="glass-input w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="profileEmail" className="block text-sm text-white/70 mb-1">
          {dict.auth.email}
        </label>
        <input
          id="profileEmail"
          type="email"
          disabled
          value={profile.email}
          className="glass-input w-full !opacity-100 !text-white/60 cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm text-white/70 mb-1">
          {dict.auth.phone}
        </label>
        <div className="flex items-stretch gap-2">
          <CountryCodeSelect
            ariaLabel={dict.modal.contact.countryCode}
            value={profile.phone_country_code || "+381"}
            onChange={(value) => update("phone_country_code", value)}
          />
          <input
            id="phone"
            type="tel"
            autoComplete="tel-national"
            value={profile.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="glass-input flex-1"
          />
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
        <h4 className="font-display text-xl text-white">
          {dict.modal.contact.companyInformationTitle}
        </h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="companyName" className="block text-sm text-white/70 mb-1">
              {dict.modal.contact.companyName}
            </label>
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              placeholder={dict.modal.contact.companyNamePlaceholder}
              value={profile.company_name}
              onChange={(e) => update("company_name", e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label htmlFor="vatNumber" className="block text-sm text-white/70 mb-1">
              {dict.modal.contact.companyVatNumber}
            </label>
            <input
              id="vatNumber"
              type="text"
              autoComplete="off"
              placeholder={dict.modal.contact.companyVatNumberPlaceholder}
              value={profile.company_vat_number}
              onChange={(e) => update("company_vat_number", e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label htmlFor="companyAddress" className="block text-sm text-white/70 mb-1">
              {dict.modal.contact.companyAddress}
            </label>
            <input
              id="companyAddress"
              type="text"
              autoComplete="street-address"
              placeholder={dict.modal.contact.companyAddressPlaceholder}
              value={profile.company_address}
              onChange={(e) => update("company_address", e.target.value)}
              className="glass-input w-full"
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="btn-gold w-full justify-center"
      >
        {saving ? "..." : saved ? dict.auth.saved : dict.auth.save}
      </button>
    </form>
  );
}
