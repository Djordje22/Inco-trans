import type { Metadata, Viewport } from "next";
import { inter, playfair } from "@/lib/fonts";
import { siteConfig } from "@/lib/site-config";
import ReservationModalProvider from "@/components/ReservationModal";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} ${siteConfig.tagline.sr}`,
    template: `%s · ${siteConfig.name}`
  },
  description: siteConfig.description.sr
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1
};

export default function SrRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr-Latn" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-ink-950 text-white antialiased">
        <ReservationModalProvider locale="sr">{children}</ReservationModalProvider>
      </body>
    </html>
  );
}
