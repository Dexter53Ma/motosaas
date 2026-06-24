'use client'

import { useI18n } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLocale('fr')}
        className={`px-3 py-1 text-sm font-medium rounded ${
          locale === 'fr'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('ar')}
        className={`px-3 py-1 text-sm font-medium rounded ${
          locale === 'ar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        AR
      </button>
    </div>
  )
}