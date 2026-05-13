import Header from "./Header";
import Footer from "./Footer";
import type { Locale, RouteKey } from "@/lib/site-config";

type Props = {
  locale: Locale;
  routeKey: RouteKey;
  children: React.ReactNode;
};

export default function PageShell({ locale, routeKey, children }: Props) {
  return (
    <>
      <Header locale={locale} routeKey={routeKey} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
