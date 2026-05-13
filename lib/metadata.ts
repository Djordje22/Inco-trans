import type { Metadata } from "next";
import { siteConfig, type Locale, type RouteKey, routeMap } from "./site-config";

type Args = {
  locale: Locale;
  routeKey: RouteKey;
  title: string;
  description: string;
};

function joinUrl(base: string, path: string): string {
  return path === "/" ? base : `${base}${path}`;
}

export function buildMetadata({
  locale,
  routeKey,
  title,
  description
}: Args): Metadata {
  const path: string = routeMap[routeKey][locale];
  const srPath: string = routeMap[routeKey].sr;
  const enPath: string = routeMap[routeKey].en;
  const url = joinUrl(siteConfig.url, path);
  const ogLocale = locale === "sr" ? "sr_RS" : "en_US";

  const alternates: Record<string, string> = {
    "sr-Latn": joinUrl(siteConfig.url, srPath),
    en: joinUrl(siteConfig.url, enPath),
    "x-default": joinUrl(siteConfig.url, srPath)
  };

  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    applicationName: siteConfig.name,
    alternates: {
      canonical: url,
      languages: alternates
    },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title,
      description,
      locale: ogLocale,
      alternateLocale: locale === "sr" ? "en_US" : "sr_RS",
      images: [
        {
          url: "/brand/inco_logo_icon_1024.png",
          width: 1024,
          height: 1024,
          alt: `${siteConfig.name} logo`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/brand/inco_logo_icon_1024.png"]
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        {
          url: "/brand/inco_logo_icon_32.png",
          type: "image/png",
          sizes: "32x32"
        },
        {
          url: "/brand/inco_logo_icon_64.png",
          type: "image/png",
          sizes: "64x64"
        }
      ],
      apple: [
        {
          url: "/brand/inco_logo_icon_180.png",
          sizes: "180x180",
          type: "image/png"
        }
      ]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
