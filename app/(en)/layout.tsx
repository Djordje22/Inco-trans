import type { Metadata, Viewport } from "next";
import { inter, playfair } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import ReservationModalProvider from "@/components/ReservationModal";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} ${siteConfig.tagline.en}`,
    template: `%s · ${siteConfig.name}`
  },
  description: siteConfig.description.en
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1
};

export default function EnRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-ink-950 text-white antialiased">
        <ReservationModalProvider locale="en">{children}</ReservationModalProvider>
      </body>
    </html>
  );
}
