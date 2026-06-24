'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import LogoutButton from './LogoutButton'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard') },
    { href: '/dashboard/vehicles', label: t('nav.vehicles') },
    { href: '/dashboard/customers', label: t('nav.customers') },
    { href: '/dashboard/rentals', label: t('nav.rentals') },
    { href: '/dashboard/payments', label: t('nav.payments') },
    { href: '/dashboard/reports', label: t('nav.reports') },
    { href: '/dashboard/whatsapp', label: t('nav.whatsapp') },
    { href: '/dashboard/reminders', label: t('nav.reminders') },
    { href: '/dashboard/settings', label: t('nav.settings') },
  ]

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile menu panel */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900" onClick={() => setIsOpen(false)}>
              MotoRent
            </Link>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <LanguageSwitcher />
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )
}