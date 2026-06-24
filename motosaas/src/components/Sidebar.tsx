'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
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
  ChevronLeft,
  Calendar,
  CheckSquare,
  FolderOpen,
  MapPin,
  Fuel,
  TrendingUp,
  Receipt,
  Wallet,
  Shield,
  DollarSign,
  RotateCcw,
  Search,
  Upload,
  Download,
  ClipboardList,
  Sliders,
  Sparkles,
  ShoppingCart,
  Heart,
  MessageSquare,
} from 'lucide-react'
import { useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface User {
  email?: string
}

interface UserProfile {
  full_name?: string
  role?: string
}

interface SidebarProps {
  user?: User
  userProfile?: UserProfile
}

interface NavItemType {
  href: string
  icon: LucideIcon
  labelKey: string
}

const mainItems: NavItemType[] = [
  { href: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { href: '/dashboard/vehicles', icon: Car, labelKey: 'nav.vehicles' },
  { href: '/dashboard/customers', icon: Users, labelKey: 'nav.customers' },
  { href: '/dashboard/rentals', icon: FileText, labelKey: 'nav.rentals' },
]

const financeItems: NavItemType[] = [
  { href: '/dashboard/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { href: '/dashboard/bookings', icon: Calendar, labelKey: 'nav.bookings' },
  { href: '/dashboard/reports', icon: BarChart3, labelKey: 'nav.reports' },
  { href: '/dashboard/analytics', icon: TrendingUp, labelKey: 'nav.analytics' },
  { href: '/dashboard/loans', icon: Receipt, labelKey: 'nav.loans' },
  { href: '/dashboard/pos', icon: ShoppingCart, labelKey: 'nav.pos' },
  { href: '/dashboard/deposits', icon: Wallet, labelKey: 'nav.deposits' },
  { href: '/dashboard/insurance', icon: Shield, labelKey: 'nav.insurance' },
  { href: '/dashboard/pricing', icon: DollarSign, labelKey: 'nav.pricing' },
  { href: '/dashboard/refunds', icon: RotateCcw, labelKey: 'nav.refunds' },
]

const operationsItems: NavItemType[] = [
  { href: '/dashboard/calendar', icon: Calendar, labelKey: 'nav.calendar' },
  { href: '/dashboard/checklists', icon: CheckSquare, labelKey: 'nav.checklists' },
  { href: '/dashboard/documents', icon: FolderOpen, labelKey: 'nav.documents' },
  { href: '/dashboard/locations', icon: MapPin, labelKey: 'nav.locations' },
  { href: '/dashboard/fuel', icon: Fuel, labelKey: 'nav.fuel' },
  { href: '/dashboard/reminders', icon: Bell, labelKey: 'nav.reminders' },
]

const growthItems: NavItemType[] = [
  { href: '/dashboard/whatsapp', icon: MessageCircle, labelKey: 'nav.whatsapp' },
  { href: '/dashboard/loyalty', icon: Heart, labelKey: 'nav.loyalty' },
  { href: '/dashboard/feedback', icon: MessageCircle, labelKey: 'nav.feedback' },
  { href: '/dashboard/notifications', icon: MessageSquare, labelKey: 'nav.notifications' },
]

const systemItems: NavItemType[] = [
  { href: '/dashboard/search', icon: Search, labelKey: 'nav.search' },
  { href: '/dashboard/import', icon: Upload, labelKey: 'nav.import' },
  { href: '/dashboard/export', icon: Download, labelKey: 'nav.export' },
  { href: '/dashboard/audit-trail', icon: ClipboardList, labelKey: 'nav.audit' },
  { href: '/dashboard/custom-fields', icon: Sliders, labelKey: 'nav.custom_fields' },
  { href: '/dashboard/ai', icon: Sparkles, labelKey: 'nav.ai' },
  { href: '/dashboard/settings', icon: Settings, labelKey: 'nav.settings' },
  { href: '/dashboard/help', icon: HelpCircle, labelKey: 'help.title' },
]

interface NavItemProps {
  href: string
  icon: LucideIcon
  labelKey: string
  isActive: boolean
  collapsed: boolean
  t: (key: string) => string
}

const NavItem = ({ href, icon: Icon, labelKey, isActive, collapsed, t }: NavItemProps) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    render={<Link href={href} />}
    className={`w-full justify-start gap-3 h-9 rounded-lg text-[13px] font-medium transition-all duration-200 relative ${
      isActive
        ? 'bg-white/[0.08] text-white border-l-2 border-emerald-500 -ml-[2px] pl-[18px]'
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
    }`}
  >
    <Icon className="w-[18px] h-[18px] shrink-0" />
    {!collapsed && <span>{t(labelKey)}</span>}
  </Button>
)

interface NavGroupProps {
  titleKey: string
  items: NavItemType[]
  collapsed: boolean
  t: (key: string) => string
  pathname: string
  isLast?: boolean
}

const NavGroup = ({ titleKey, items, collapsed, t, pathname, isLast }: NavGroupProps) => {
  const isActiveItem = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }
  return (
    <div className={!isLast ? 'pb-5 border-b border-white/[0.04] mb-5' : ''}>
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-500">
          {t(titleKey)}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            labelKey={item.labelKey}
            isActive={isActiveItem(item.href)}
            collapsed={collapsed}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}

export default function Sidebar(_props: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen bg-[#0a0a0f] text-white transition-all duration-300 border-r border-white/[0.06] ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-14 shrink-0 border-b border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              MotoRent
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto">
            <Car className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] rounded-md h-7 w-7"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        )}
      </div>

      {/* Collapsed toggle when collapsed */}
      {collapsed && (
        <div className="px-2 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] rounded-md h-7 w-full"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0 scrollbar-none">
        <NavGroup titleKey="nav.group.core" items={mainItems} collapsed={collapsed} t={t} pathname={pathname} />
        <NavGroup titleKey="nav.group.finance" items={financeItems} collapsed={collapsed} t={t} pathname={pathname} />
        <NavGroup titleKey="nav.group.operations" items={operationsItems} collapsed={collapsed} t={t} pathname={pathname} />
        <NavGroup titleKey="nav.group.growth" items={growthItems} collapsed={collapsed} t={t} pathname={pathname} />
        <NavGroup titleKey="nav.group.tools" items={systemItems} collapsed={collapsed} t={t} pathname={pathname} isLast />
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <Button
          variant="ghost"
          render={
            <Link
              href="/login"
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                await supabase.auth.signOut()
              }}
            />
          }
          className="w-full justify-start gap-3 h-9 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/[0.08]"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>{t('nav.logout')}</span>}
        </Button>
      </div>
    </aside>
  )
}
