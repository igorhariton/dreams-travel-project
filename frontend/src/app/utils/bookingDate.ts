const LANGUAGE_TO_LOCALE = {
  en: 'en-US',
  ro: 'ro-RO',
  ru: 'ru-RU',
} as const;

type SupportedLanguage = keyof typeof LANGUAGE_TO_LOCALE;

export function resolveBookingLocale(language: string): string {
  if (language in LANGUAGE_TO_LOCALE) {
    return LANGUAGE_TO_LOCALE[language as SupportedLanguage];
  }
  return LANGUAGE_TO_LOCALE.en;
}

export function formatBookingDateTime(bookedAt: string, language: string, includeTime = true): string {
  const date = new Date(bookedAt);
  if (Number.isNaN(date.getTime())) return '';

  const locale = resolveBookingLocale(language);

  if (!includeTime) {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatBookingLabel(
  bookedAt: string,
  language: string,
  options?: { includeTime?: boolean; prefix?: string },
): string {
  const label = formatBookingDateTime(bookedAt, language, options?.includeTime ?? true);
  if (!label) return '';
  const prefix = options?.prefix ?? 'Booked on';
  return `${prefix} ${label}`;
}
