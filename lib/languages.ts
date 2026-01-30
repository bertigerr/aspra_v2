export const SUPPORTED_ACTIVE_LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
] as const

export type ActiveLang = (typeof SUPPORTED_ACTIVE_LANGS)[number]["code"]

export const SUPPORTED_NATIVE_LANGS = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
] as const

export type NativeLang = (typeof SUPPORTED_NATIVE_LANGS)[number]["code"]

export const LANGUAGE_LEVELS = [
  {
    code: "beginner",
    label: "Начинающий",
    description: "Простая лексика",
  },
  {
    code: "intermediate",
    label: "Продолжающий",
    description: "Лексика среднего уровня",
  },
  {
    code: "advanced",
    label: "Продвинутый",
    description: "Продвинутая лексика",
  },
] as const

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number]["code"]

export function isActiveLang(value: string): value is ActiveLang {
  return SUPPORTED_ACTIVE_LANGS.some((lang) => lang.code === value)
}

export function isNativeLang(value: string): value is NativeLang {
  return SUPPORTED_NATIVE_LANGS.some((lang) => lang.code === value)
}

export function isLanguageLevel(value: string): value is LanguageLevel {
  return LANGUAGE_LEVELS.some((level) => level.code === value)
}

export function getLangLabel(code: string) {
  return (
    SUPPORTED_NATIVE_LANGS.find((l) => l.code === code)?.label ??
    SUPPORTED_ACTIVE_LANGS.find((l) => l.code === code)?.label ??
    code
  )
}

export function getLangFlag(code: string) {
  return (
    SUPPORTED_NATIVE_LANGS.find((l) => l.code === code)?.flag ??
    SUPPORTED_ACTIVE_LANGS.find((l) => l.code === code)?.flag ??
    "🏳️"
  )
}

