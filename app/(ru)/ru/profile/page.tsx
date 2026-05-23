import PageShell from "@/components/PageShell";
import AuthFormShell from "@/components/auth/AuthFormShell";
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
      <AuthFormShell title={dict.auth.profileTitle} subtitle={dict.auth.profileSubtitle}>
        <ProfileForm locale={locale} dict={dict} />
        <div className="mt-8 border-t border-white/10 pt-8 space-y-6">
          <LoyaltyProgress locale={locale} dict={dict} />
          <ReferralCard locale={locale} dict={dict} />
        </div>
      </AuthFormShell>
    </PageShell>
  );
}
