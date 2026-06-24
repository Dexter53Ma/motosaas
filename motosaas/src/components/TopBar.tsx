'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Bell, Menu, User } from 'lucide-react'
import { useState } from 'react'

interface User {
  email?: string
}

interface UserProfile {
  full_name?: string
  role?: string
}

interface TopBarProps {
  user?: User
  userProfile?: UserProfile
  onMenuToggle?: () => void
}

export default function TopBar({ user, userProfile, onMenuToggle }: TopBarProps) {
  const { t } = useI18n()
  const [searchFocused, setSearchFocused] = useState(false)

  const userName = userProfile?.full_name || user?.email?.split('@')[0] || 'User'
  const userInitial = userName[0]?.toUpperCase() || 'U'

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden text-gray-500 hover:bg-gray-100 rounded-lg h-8 w-8"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className={`relative hidden sm:flex items-center transition-all duration-300 ${searchFocused ? 'w-80' : 'w-72'}`}>
          <Search className="absolute left-3 w-4 h-4 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder={t('topbar.search')}
            className="pl-9 bg-gray-100 border-transparent rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 focus:bg-white text-[13px] h-9 shadow-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:bg-gray-100 rounded-lg h-8 w-8">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-1.5" />
        <Button variant="ghost" render={<Link href="/dashboard/settings" />} className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 h-auto rounded-lg hover:bg-gray-100 transition-all">
          <span className="hidden sm:block text-[13px] font-medium text-gray-700 leading-tight">
            {userName}
          </span>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  )
}
