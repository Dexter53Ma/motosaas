'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'General', href: '/dashboard/settings' },
  { name: 'Subscription', href: '/dashboard/settings/subscription' },
  { name: 'Team', href: '/dashboard/settings/team' },
  { name: 'WhatsApp', href: '/dashboard/settings/whatsapp' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-64 flex-shrink-0">
        <nav className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Settings</h2>
          </div>
          <div className="p-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex-1">{children}</div>
    </div>
  )
}
