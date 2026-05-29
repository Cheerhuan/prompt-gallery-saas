export type Locale = 'en' | 'zh' | 'ja' | 'ko';

/** Map of locale key to dynamic import function */
const localeLoaders: Record<Locale, () => Promise<{ default: Record<string, any> }>> = {
  en: () => import('./locales/en'),
  zh: () => import('./locales/zh'),
  ja: () => import('./locales/ja'),
  ko: () => import('./locales/ko'),
};

const cache = new Map<Locale, Record<string, any>>();

/** Dynamically load a locale's translations */
export async function loadLocale(locale: Locale): Promise<Record<string, any>> {
  if (cache.has(locale)) return cache.get(locale)!;
  const mod = await localeLoaders[locale]();
  cache.set(locale, mod.default);
  return mod.default;
}

/** Synchronous accessor — locale must be loaded first */
export function getTranslations(locale: Locale): Record<string, any> {
  return cache.get(locale) || {};
}

/** Get translated card title based on locale and card ID */
export function getCardTitle(id: string | number, fallbackTitle: string, locale: Locale): string {
  const tid = String(id);
  const localeData = cache.get(locale);
  const titles = localeData?.cardTitles;
  if (titles && titles[tid]) return titles[tid];
  return fallbackTitle;
}
