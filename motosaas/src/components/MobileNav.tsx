'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Menu,
  Calendar,
  TrendingUp,
  Receipt,
  ShoppingCart,
  DollarSign,
  CheckSquare,
  Sparkles,
  Search,
  LucideIcon,
} from 'lucide-react'

interface NavItemType {
  href: string
  icon: LucideIcon
  labelKey: string
}

const generalItems: NavItemType[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/dashboard/vehicles', icon: Car, labelKey: 'nav.vehicles' },
  { href: '/dashboard/customers', icon: Users, labelKey: 'nav.customers' },
  { href: '/dashboard/rentals', icon: FileText, labelKey: 'nav.rentals' },
  { href: '/dashboard/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { href: '/dashboard/bookings', icon: Calendar, labelKey: 'nav.bookings' },
  { href: '/dashboard/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { href: '/dashboard/analytics', icon: TrendingUp, labelKey: 'nav.analytics' },
  { href: '/dashboard/loans', icon: Receipt, labelKey: 'nav.loans' },
  { href: '/dashboard/pos', icon: ShoppingCart, labelKey: 'nav.pos' },
  { href: '/dashboard/pricing', icon: DollarSign, labelKey: 'nav.pricing' },
]

const operationsItems: NavItemType[] = [
  { href: '/dashboard/calendar', icon: Calendar, labelKey: 'nav.calendar' },
  { href: '/dashboard/checklists', icon: CheckSquare, labelKey: 'nav.checklists' },
  { href: '/dashboard/reminders', icon: Bell, labelKey: 'nav.reminders' },
]

const communicationItems: NavItemType[] = [
  { href: '/dashboard/whatsapp', icon: MessageCircle, labelKey: 'nav.whatsapp' },
]

const systemItems: NavItemType[] = [
  { href: '/dashboard/search', icon: Search, labelKey: 'nav.search' },
  { href: '/dashboard/ai', icon: Sparkles, labelKey: 'nav.ai' },
  { href: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings' },
  { href: '/dashboard/help', icon: HelpCircle, labelKey: 'help.title' },
]

interface MobileNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  isActive: boolean
  onClose: () => void
}

function MobileNavItem({ href, icon: Icon, label, isActive, onClose }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
        isActive
          ? 'bg-white/[0.08] text-white border-l-2 border-emerald-500 -ml-[2px] pl-[14px]'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
      }`}
    >
      <Icon className="w-[18px] h-[18px] shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

interface MobileNavGroupProps {
  title: string
  items: NavItemType[]
  t: (key: string) => string
  isActive: (href: string) => boolean
  onClose: () => void
  isLast?: boolean
}

function MobileNavGroup({ title, items, t, isActive, onClose, isLast }: MobileNavGroupProps) {
  return (
    <div className={!isLast ? 'pb-4 border-b border-white/[0.04] mb-4' : ''}>
      <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">{title}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <MobileNavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={t(item.labelKey)}
            isActive={isActive(item.href)}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  )
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-64 bg-[#0a0a0f] h-full flex flex-col text-white">
            <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="text-[15px] font-semibold">MotoRent</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-white/[0.06] text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
              <MobileNavGroup title="Main" items={generalItems} t={t} isActive={isActive} onClose={() => setIsOpen(false)} />
              <MobileNavGroup title="Operations" items={operationsItems} t={t} isActive={isActive} onClose={() => setIsOpen(false)} />
              <MobileNavGroup title="Communication" items={communicationItems} t={t} isActive={isActive} onClose={() => setIsOpen(false)} />
              <MobileNavGroup title="System" items={systemItems} t={t} isActive={isActive} onClose={() => setIsOpen(false)} isLast />
            </nav>

            <div className="px-3 py-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3 px-3">
                <LanguageSwitcher />
              </div>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08]"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>{t('nav.logout')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
