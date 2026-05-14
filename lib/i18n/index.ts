import type { Locale } from "../site-config";
import type { Dict } from "./types";
import { sr } from "./sr";
import { en } from "./en";
import { ru } from "./ru";

export type { Dict, ServiceKey } from "./types";

export const translations: Record<Locale, Dict> = { sr, en, ru };

export function t(locale: Locale): Dict {
  return translations[locale];
}
