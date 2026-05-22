import PageShell from "@/components/PageShell";
import AuthFormShell from "@/components/auth/AuthFormShell";
import LoginForm from "@/components/auth/LoginForm";
import { buildMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

const locale = "sr" as const;
const dict = t(locale);

export const metadata = buildMetadata({
  locale,
  routeKey: "login",
  title: dict.auth.loginTitle,
  description: dict.auth.loginSubtitle
});

export default function PrijavaPage() {
  return (
    <PageShell locale={locale} routeKey="login">
      <AuthFormShell title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle}>
        <LoginForm locale={locale} dict={dict} />
      </AuthFormShell>
    </PageShell>
  );
}
