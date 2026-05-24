import PageShell from "@/components/PageShell";
import ProfileForm from "@/components/auth/ProfileForm";
import ReferralCard from "@/components/auth/ReferralCard";
import LoyaltyProgress from "@/components/auth/LoyaltyProgress";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "ru" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "profile",
  title: dict.auth.profileTitle,
  description: dict.auth.profileSubtitle
});

export default function ProfilePage() {
  return (
    <PageShell locale={locale} routeKey="profile">
      <section className="container-tight py-16 sm:py-20">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">
            {dict.auth.profileTitle}
          </h1>
          <p className="mt-2 text-sm text-white/60">{dict.auth.profileSubtitle}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
          <div className="glass rounded-2xl p-6 sm:p-8">
            <ProfileForm locale={locale} dict={dict} />
          </div>
          <div className="space-y-6">
            <LoyaltyProgress locale={locale} dict={dict} />
            <ReferralCard locale={locale} dict={dict} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
