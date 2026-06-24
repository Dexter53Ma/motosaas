'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Car,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Plus,
  Zap,
  Wrench,
  LogIn,
  LogOut as LogOutIcon,
  CreditCard,
} from 'lucide-react'
import { format } from 'date-fns'

interface DashboardContentProps {
  user: any
  userProfile: any
  tenant: any
  trialDaysRemaining: number
  stats?: {
    totalVehicles: number
    activeRentals: number
    outstanding: number
    totalCustomers: number
    vehicleChange?: number
    rentalChange?: number
    outstandingChange?: number
    customerChange?: number
  }
  rentalStatusCounts?: {
    active: number
    completed: number
    overdue: number
  }
  monthlyRevenue?: { month: string; revenue: number }[]
  recentRentals?: any[]
}

const CHART_COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  violet: '#8b5cf6',
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  colorClass,
  index,
}: {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: any
  colorClass: string
  index: number
}) {
  const isPositive = (change ?? 0) >= 0

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className={cn('shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-100', colorClass)}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
              <p className="text-[28px] font-bold mt-2 tracking-tight tabular-nums">{value}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  isPositive ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}%
              </span>
              {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg border-0 text-xs">
      <p className="text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold">
        {payload[0].value.toLocaleString()} MAD
      </p>
    </div>
  )
}

const renderPieLegend = (props: any) => {
  const { payload } = props
  return (
    <div className="flex justify-center gap-4 mt-1">
      {payload?.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  )
}

export default function DashboardContent({
  user,
  userProfile,
  tenant,
  trialDaysRemaining,
  stats,
  rentalStatusCounts = { active: 0, completed: 0, overdue: 0 },
  monthlyRevenue = [],
  recentRentals = [],
}: DashboardContentProps) {
  const { t } = useI18n()

  const userName =
    userProfile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'there'

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const statCards = [
    {
      title: t('dashboard.total_vehicles'),
      value: String(stats?.totalVehicles ?? 0),
      change: stats?.vehicleChange,
      changeLabel: t('common.vs_last_month'),
      icon: Car,
      colorClass: 'bg-blue-50/80',
    },
    {
      title: t('dashboard.active_rentals'),
      value: String(stats?.activeRentals ?? 0),
      change: stats?.rentalChange,
      changeLabel: t('common.vs_last_month'),
      icon: FileText,
      colorClass: 'bg-emerald-50/80',
    },
    {
      title: t('dashboard.revenue'),
      value: `${(stats?.outstanding ?? 0).toLocaleString()} MAD`,
      change: stats?.outstandingChange,
      changeLabel: t('common.vs_last_month'),
      icon: DollarSign,
      colorClass: 'bg-amber-50/80',
    },
    {
      title: t('dashboard.customers_count'),
      value: String(stats?.totalCustomers ?? 0),
      change: stats?.customerChange,
      changeLabel: t('common.vs_last_month'),
      icon: Users,
      colorClass: 'bg-violet-50/80',
    },
  ]

  const pieData = [
    { name: t('common.active'), value: rentalStatusCounts.active, color: CHART_COLORS.emerald },
    { name: t('rentals.completed'), value: rentalStatusCounts.completed, color: CHART_COLORS.blue },
    { name: t('rentals.overdue'), value: rentalStatusCounts.overdue, color: CHART_COLORS.amber },
  ]

  const totalRentals = rentalStatusCounts.active + rentalStatusCounts.completed + rentalStatusCounts.overdue

  const todaySchedule = [
    { time: '09:00', icon: LogOutIcon, color: 'text-emerald-500 bg-emerald-50', title: 'Toyota Corolla Return', subtitle: 'Ahmed Benali', action: 'Process' },
    { time: '10:30', icon: LogIn, color: 'text-blue-500 bg-blue-50', title: 'Honda CB500 Pickup', subtitle: 'Youssef El Amrani', action: 'Prepare' },
    { time: '14:00', icon: CreditCard, color: 'text-amber-500 bg-amber-50', title: 'Loan Payment Due', subtitle: 'Karim Oujdi — 2,500 MAD', action: 'Follow up' },
    { time: '16:00', icon: Wrench, color: 'text-gray-500 bg-gray-50', title: 'Kawasaki Ninja Service', subtitle: 'Scheduled maintenance', action: 'View' },
  ]

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Trial pill */}
      {tenant?.subscription_status === 'trial' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
            <Zap className="w-3 h-3" />
            {t('dashboard.free_trial')} · {t('common.days_remaining')} {trialDaysRemaining}
            <Button render={<Link href="/dashboard/settings" />} variant="ghost" className="h-auto p-0 text-emerald-600 hover:text-emerald-700 text-xs font-medium ml-1">
              {t('common.upgrade')} →
            </Button>
          </div>
        </motion.div>
      )}

      {/* Welcome + Quick Actions */}
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {greeting}, {userName.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{dateStr}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/vehicles/new" />} className="text-gray-600 hover:bg-gray-100 rounded-lg h-9 text-[13px]">
            <Plus className="w-4 h-4 mr-1" /> {t('dashboard.new_vehicle')}
          </Button>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-9 text-[13px] shadow-sm" render={<Link href="/dashboard/rentals/new" />}>
            <Plus className="w-4 h-4 mr-1" /> {t('dashboard.new_rental')}
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.title} {...card} index={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                {t('dashboard.revenue_overview')}
              </CardTitle>
              <CardAction>
                <span className="text-xs text-gray-400">{t('dashboard.last_6_months')}</span>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.emerald}
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                      dot={{ r: 0, fill: CHART_COLORS.emerald, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS.emerald }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rental Status Donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Card className="h-full shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">{t('dashboard.rental_status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend content={renderPieLegend} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center pt-2 pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{totalRentals}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row: Rentals Table + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Rentals Table */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900">{t('dashboard.recent_rentals')}</CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" render={<Link href="/dashboard/rentals" className="text-emerald-600 hover:text-emerald-700 text-xs" />}>
                  {t('common.view_all')} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {recentRentals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{t('common.customer')}</TableHead>
                      <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{t('common.vehicle')}</TableHead>
                      <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{t('common.dates')}</TableHead>
                      <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{t('common.amount')}</TableHead>
                      <TableHead className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{t('common.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRentals.slice(0, 5).map((rental: any) => (
                      <TableRow key={rental.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="text-[13px] font-medium text-gray-900">{rental.customer_name || '—'}</TableCell>
                        <TableCell className="text-[13px] text-gray-600">{rental.vehicle_name || '—'}</TableCell>
                        <TableCell className="text-[13px] text-gray-500">
                          {rental.start_date
                            ? format(new Date(rental.start_date), 'MMM d')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-[13px] font-medium tabular-nums">
                          {(rental.total_amount ?? 0).toLocaleString()} MAD
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rental.status === 'active'
                                ? 'default'
                                : rental.status === 'completed'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className={cn(
                              'text-[11px] font-medium',
                              rental.status === 'active' && 'bg-emerald-50 text-emerald-700 border-emerald-100',
                              rental.status === 'completed' && 'bg-blue-50 text-blue-700 border-blue-100',
                              rental.status === 'overdue' && 'bg-red-50 text-red-700 border-red-100'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full mr-1',
                                rental.status === 'active'
                                  ? 'bg-emerald-500'
                                  : rental.status === 'completed'
                                  ? 'bg-blue-500'
                                  : 'bg-red-500'
                              )}
                            />
                            {rental.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">{t('rentals.no_rentals')}</p>
                  <Button variant="ghost" size="sm" render={<Link href="/dashboard/rentals/new" />} className="mt-3 text-emerald-600 hover:text-emerald-700 text-xs">
                    <Plus className="w-3.5 h-3.5" /> {t('rentals.add')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="h-full shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {t('dashboard.recent_activity')}
              </CardTitle>
              <CardAction>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 text-xs">
                  {t('common.view_all')} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaySchedule.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="shrink-0 text-[11px] font-medium text-gray-400 w-10 tabular-nums">
                      {item.time}
                    </div>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.color)}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-[11px] font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {item.action}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
