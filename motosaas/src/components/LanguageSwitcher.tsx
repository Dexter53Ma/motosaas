'use client'

import { useI18n } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => setLocale('fr')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
          locale === 'fr'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('ar')}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
          locale === 'ar'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        AR
      </button>
    </div>
  )
}
