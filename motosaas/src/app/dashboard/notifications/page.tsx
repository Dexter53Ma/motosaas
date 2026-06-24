'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  RotateCcw,
  Settings,
  Megaphone,
  Filter,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Notification {
  id: string
  user_id: string
  type: 'payment_due' | 'rental_return' | 'system' | 'promotion'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  payment_due: { color: 'bg-red-100 text-red-800', icon: CreditCard, label: 'Payment Due' },
  rental_return: { color: 'bg-orange-100 text-orange-800', icon: RotateCcw, label: 'Rental Return' },
  system: { color: 'bg-blue-100 text-blue-800', icon: Settings, label: 'System' },
  promotion: { color: 'bg-purple-100 text-purple-800', icon: Megaphone, label: 'Promotion' },
}

export default function NotificationsPage() {
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => { fetchNotifications() }, [])

  async function fetchNotifications() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (notifData) setNotifications(notifData)
    setLoading(false)
  }

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    toast.success('Marked as read')
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    toast.success('All notifications marked as read')
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    toast.success('Notification deleted')
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const filtered = notifications.filter(n => {
    const matchType = typeFilter === 'all' || n.type === typeFilter
    const matchRead = readFilter === 'all' ||
      (readFilter === 'unread' && !n.is_read) ||
      (readFilter === 'read' && n.is_read)
    return matchType && matchRead
  })

  const unreadCount = notifications.filter(n => !n.is_read).length
  const today = new Date().toISOString().split('T')[0]
  const todayCount = notifications.filter(n => n.created_at?.startsWith(today)).length

  const typeCounts = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("notifications.title")}</h1>
            <p className="text-gray-600">{t("notifications.desc")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="size-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Bell className="size-4" />
                <p className="text-sm">{t("notifications.total")}</p>
              </div>
              <p className="text-2xl font-bold">{notifications.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[#10b981] mb-1">
                <BellOff className="size-4" />
                <p className="text-sm">{t("notifications.unread")}</p>
              </div>
              <p className="text-2xl font-bold text-[#10b981]">{unreadCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <CreditCard className="size-4" />
                <p className="text-sm">{t("notifications.filter_rental_return")}</p>
              </div>
              <p className="text-2xl font-bold">{typeCounts.payment_due || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-500 mb-1">
                <RotateCcw className="size-4" />
                <p className="text-sm">Returns</p>
              </div>
              <p className="text-2xl font-bold">{typeCounts.rental_return || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Megaphone className="size-4" />
                <p className="text-sm">Today</p>
              </div>
              <p className="text-2xl font-bold">{todayCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("notifications.filter_all_types")}</SelectItem>
              <SelectItem value="payment_due">{t("notifications.filter_rental_return")}</SelectItem>
              <SelectItem value="rental_return">{t("notifications.filter_rental_return")}</SelectItem>
              <SelectItem value="system">{t("notifications.filter_system")}</SelectItem>
              <SelectItem value="promotion">{t("notifications.filter_promotion")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={(v) => v && setReadFilter(v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">{t("notifications.unread")}</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.inbox")}</CardTitle>
            <CardDescription>Your notification inbox</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("notifications.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t("notifications.empty")}</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((notif) => {
                  const typeConfig = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system
                  const TypeIcon = typeConfig.icon
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border flex items-start gap-3 transition-colors ${
                        notif.is_read ? 'bg-white border-gray-200' : 'bg-[#10b981]/5 border-[#10b981]/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <TypeIcon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.created_at ? new Date(notif.created_at).toLocaleString('fr-FR') : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <CheckCheck className="size-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          Ã—
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("notifications.preferences")}</CardTitle>
            <CardDescription>{t("notifications.config_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(TYPE_CONFIG).map(([type, config]) => {
                const TypeIcon = config.icon
                return (
                  <div key={type} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <TypeIcon className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-sm text-gray-500">
                          {typeCounts[type] || 0} notifications
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#10b981] rounded" />
                        <span className="text-sm">{t("notifications.in_app")}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#10b981] rounded" />
                        <span className="text-sm">{t("notifications.whatsapp")}</span>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
