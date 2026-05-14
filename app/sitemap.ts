import type { MetadataRoute } from "next";
import { siteConfig, routeMap, type RouteKey } from "@/lib/site-config";

function joinUrl(base: string, path: string): string {
  return path === "/" ? base : `${base}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const keys = Object.keys(routeMap) as RouteKey[];

  return keys.map((key) => {
    const sr = routeMap[key].sr;
    const en = routeMap[key].en;
    const ru = routeMap[key].ru;
    return {
      url: joinUrl(siteConfig.url, sr),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: key === "home" ? 1.0 : 0.7,
      alternates: {
        languages: {
          "sr-Latn": joinUrl(siteConfig.url, sr),
          en: joinUrl(siteConfig.url, en),
          ru: joinUrl(siteConfig.url, ru),
          "x-default": joinUrl(siteConfig.url, sr)
        }
      }
    };
  });
}
