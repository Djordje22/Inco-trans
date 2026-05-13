import type { MetadataRoute } from "next";
import { siteConfig, routeMap, type RouteKey } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const keys = Object.keys(routeMap) as RouteKey[];

  return keys.map((key) => {
    const sr: string = routeMap[key].sr;
    const en: string = routeMap[key].en;
    const url = `${siteConfig.url}${sr === "/" ? "" : sr}`;
    return {
      url,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: key === "home" ? 1.0 : 0.7,
      alternates: {
        languages: {
          "sr-Latn": `${siteConfig.url}${sr === "/" ? "" : sr}`,
          en: `${siteConfig.url}${en === "/" ? "" : en}`,
          "x-default": `${siteConfig.url}${sr === "/" ? "" : sr}`
        }
      }
    };
  });
}
