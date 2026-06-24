'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import {
  getRevenueReport,
  getVehicleUtilizationReport,
  getCustomerAnalyticsReport,
  getMonthlyRevenue,
  getRentalStatusDistribution,
  downloadCSV,
  formatCurrency,
  type RevenueReport,
  type VehicleUtilization,
  type CustomerAnalytics,
} from '@/lib/reports'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  Users,
  Bike,
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  BarChart3,
} from 'lucide-react'

const CHART_COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  rose: '#f43f5e',
}

const RENTAL_STATUS_COLORS: Record<string, string> = {
  active: CHART_COLORS.emerald,
  completed: CHART_COLORS.blue,
  overdue: CHART_COLORS.rose,
  cancelled: CHART_COLORS.amber,
  pending: CHART_COLORS.violet,
}

const PAYMENT_METHOD_COLORS = [
  CHART_COLORS.emerald,
  CHART_COLORS.blue,
  CHART_COLORS.amber,
  CHART_COLORS.violet,
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' as const },
  }),
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  )
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium capitalize">{payload[0].name}</p>
      <p className="text-lg font-bold text-foreground">{payload[0].value}</p>
    </div>
  )
}

function CustomDonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium capitalize">{payload[0].name}</p>
      <p className="text-lg font-bold text-foreground">{payload[0].value} rentals</p>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  if (!payload) return null
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted-foreground capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'revenue' | 'vehicles' | 'customers' | 'rentals'>('revenue')
  const [revenueData, setRevenueData] = useState<RevenueReport[]>([])
  const [vehicleData, setVehicleData] = useState<VehicleUtilization[]>([])
  const [customerData, setCustomerData] = useState<CustomerAnalytics[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [rentalStatus, setRentalStatus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tenantId, setTenantId] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    setTenantId(userData.tenant_id)

    const [revenue, vehicles, customers, monthly, status] = await Promise.all([
      getRevenueReport(userData.tenant_id).catch(() => []),
      getVehicleUtilizationReport(userData.tenant_id).catch(() => []),
      getCustomerAnalyticsReport(userData.tenant_id).catch(() => []),
      getMonthlyRevenue(userData.tenant_id).catch(() => []),
      getRentalStatusDistribution(userData.tenant_id).catch(() => []),
    ])

    setRevenueData(revenue)
    setVehicleData(vehicles)
    setCustomerData(customers)
    setMonthlyRevenue(monthly)
    setRentalStatus(status)
    setLoading(false)
  }

  async function handleFilter() {
    if (!tenantId) return
    setLoading(true)
    const revenue = await getRevenueReport(tenantId, startDate || undefined, endDate || undefined).catch(() => [])
    setRevenueData(revenue)
    setLoading(false)
  }

  function handleExport() {
    switch (activeTab) {
      case 'revenue':
        downloadCSV(revenueData, 'revenue_report')
        break
      case 'vehicles':
        downloadCSV(vehicleData, 'vehicle_utilization')
        break
      case 'customers':
        downloadCSV(customerData, 'customer_analytics')
        break
      case 'rentals':
        downloadCSV(rentalStatus, 'rental_status')
        break
    }
  }

  const totalRevenue = revenueData.reduce((sum, r) => sum + (r.total_revenue || 0), 0)
  const totalTransactions = revenueData.reduce((sum, r) => sum + (r.transaction_count || 0), 0)
  const avgUtilization = vehicleData.length > 0
    ? (vehicleData.reduce((s, v) => s + (v.utilization_rate || 0), 0) / vehicleData.length).toFixed(0)
    : '0'

  const chartMonthlyRevenue = monthlyRevenue
    .slice(-6)
    .map((item) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      revenue: item.total_revenue || 0,
    }))

  const paymentMethodData = revenueData.reduce(
    (acc, r) => ({
      cash: acc.cash + (r.cash_revenue || 0),
      card: acc.card + (r.card_revenue || 0),
      bank: acc.bank + (r.bank_transfer_revenue || 0),
      mobile: acc.mobile + (r.mobile_money_revenue || 0),
    }),
    { cash: 0, card: 0, bank: 0, mobile: 0 }
  )

  const piePaymentData = [
    { name: 'Cash', value: paymentMethodData.cash },
    { name: 'Card', value: paymentMethodData.card },
    { name: 'Bank Transfer', value: paymentMethodData.bank },
    { name: 'Mobile Money', value: paymentMethodData.mobile },
  ].filter((d) => d.value > 0)

  const topVehicles = [...vehicleData]
    .sort((a, b) => (b.days_rented || 0) - (a.days_rented || 0))
    .slice(0, 5)
    .map((v) => ({
      name: `${v.make} ${v.model}`,
      days: Math.round(v.days_rented || 0),
    }))

  const tabs = [
    { key: 'revenue' as const, label: t('reports.tab_revenue'), icon: DollarSign },
    { key: 'vehicles' as const, label: t('reports.tab_vehicles'), icon: Bike },
    { key: 'customers' as const, label: t('reports.tab_customers'), icon: Users },
    { key: 'rentals' as const, label: t('reports.tab_rentals'), icon: BarChart3 },
  ]

  return (
    <PageTransition>
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.desc')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t('reports.export_csv')}
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all',
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ─── Revenue Tab ─── */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t('reports.total_revenue'), value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-500' },
                  { label: t('reports.transactions'), value: totalTransactions.toLocaleString(), icon: CreditCard, color: 'text-blue-500' },
                  { label: t('reports.avg_transaction'), value: totalTransactions > 0 ? formatCurrency(totalRevenue / totalTransactions) : '0 MAD', icon: TrendingUp, color: 'text-amber-500' },
                  { label: t('reports.fleet_utilization'), value: `${avgUtilization}%`, icon: Bike, color: 'text-violet-500' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </div>
                          <div className={cn('rounded-lg bg-muted p-2', stat.color)}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Revenue Bar Chart */}
                <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.monthly_revenue')}</CardTitle>
                      <CardDescription>{t('reports.last_6_months')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {chartMonthlyRevenue.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartMonthlyRevenue} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" />
                            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                            <Bar dataKey="revenue" fill={CHART_COLORS.emerald} radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Rental Status Donut Chart */}
                <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('reports.rental_status')}</CardTitle>
                      <CardDescription>{t('reports.current_distribution')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {rentalStatus.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={rentalStatus.map((s) => ({ name: s.status, value: s.count || 0 }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {rentalStatus.map((entry) => (
                                  <Cell
                                    key={entry.status}
                                    fill={RENTAL_STATUS_COLORS[entry.status] || CHART_COLORS.blue}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomDonutTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {rentalStatus.map((s) => (
                              <div key={s.status} className="flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: RENTAL_STATUS_COLORS[s.status] || CHART_COLORS.blue }}
                                />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {s.status} ({s.count})
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Vehicle Utilization + Payment Method */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Horizontal Bar Chart - Vehicle Utilization */}
                <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('reports.vehicle_utilization')}</CardTitle>
                      <CardDescription>{t('reports.top_5_vehicles')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topVehicles.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={topVehicles} layout="vertical" barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" horizontal={false} />
                            <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis
                              type="category"
                              dataKey="name"
                              className="text-xs"
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                              width={120}
                              tickFormatter={(v) => v.length > 16 ? v.slice(0, 16) + '…' : v}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                return (
                                  <div className="rounded-lg border bg-background p-3 shadow-md">
                                    <p className="text-sm font-medium">{payload[0]?.payload?.name}</p>
                                    <p className="text-lg font-bold">{payload[0].value} days</p>
                                  </div>
                                )
                              }}
                              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                            />
                            <Bar dataKey="days" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Payment Method Pie Chart */}
                <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{t('reports.payment_methods')}</CardTitle>
                      <CardDescription>{t('reports.breakdown')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {piePaymentData.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                      ) : (
                        <>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={piePaymentData}
                                cx="50%"
                                cy="50%"
                                outerRadius={95}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                              >
                                {piePaymentData.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={PAYMENT_METHOD_COLORS[i % PAYMENT_METHOD_COLORS.length]}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomPieTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {piePaymentData.map((entry, i) => (
                              <div key={entry.name} className="flex items-center gap-1.5">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: PAYMENT_METHOD_COLORS[i % PAYMENT_METHOD_COLORS.length] }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {entry.name}: {formatCurrency(entry.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Date Filter + Table */}
              <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <CardTitle>{t('reports.daily_revenue')}</CardTitle>
                        <CardDescription>{t('reports.detailed_breakdown')}</CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-3 py-1.5 text-sm border rounded-md bg-background"
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-3 py-1.5 text-sm border rounded-md bg-background"
                        />
                        <Button size="sm" onClick={handleFilter}>{t('reports.filter')}</Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {revenueData.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">{t('reports.no_data')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Txns</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Cash</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Card</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Bank</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Mobile</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueData.slice(0, 30).map((item) => (
                              <tr key={item.report_date} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="py-2.5">{new Date(item.report_date).toLocaleDateString('fr-FR')}</td>
                                <td className="text-right py-2.5">{item.transaction_count}</td>
                                <td className="text-right py-2.5">{formatCurrency(item.cash_revenue || 0)}</td>
                                <td className="text-right py-2.5">{formatCurrency(item.card_revenue || 0)}</td>
                                <td className="text-right py-2.5">{formatCurrency(item.bank_transfer_revenue || 0)}</td>
                                <td className="text-right py-2.5">{formatCurrency(item.mobile_money_revenue || 0)}</td>
                                <td className="text-right py-2.5 font-semibold">{formatCurrency(item.total_revenue || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* ─── Vehicles Tab ─── */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: t('reports.all_vehicles'), value: vehicleData.length.toString() },
                  { label: t('reports.utilization'), value: `${avgUtilization}%` },
                  { label: t('reports.total_revenue'), value: formatCurrency(vehicleData.reduce((s, v) => s + (v.total_revenue || 0), 0)) },
                ].map((stat, i) => (
                  <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.02 }}>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Utilization Chart */}
              <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.vehicle_utilization')}</CardTitle>
                      <CardDescription>{t('reports.top_5_vehicles')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topVehicles.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={topVehicles} layout="vertical" barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border opacity-50" horizontal={false} />
                          <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis type="category" dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={130} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              return (
                                <div className="rounded-lg border bg-background p-3 shadow-md">
                                  <p className="text-sm font-medium">{payload[0]?.payload?.name}</p>
                                  <p className="text-lg font-bold">{payload[0].value} days rented</p>
                                </div>
                              )
                            }}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                          />
                          <Bar dataKey="days" fill={CHART_COLORS.blue} radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Table */}
              <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.all_vehicles')}</CardTitle>
                    </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium text-muted-foreground">Vehicle</th>
                            <th className="text-left py-2 font-medium text-muted-foreground">Plate</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Rentals</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Days</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Utilization</th>
                            <th className="text-right py-2 font-medium text-muted-foreground">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleData.map((vehicle) => (
                            <tr key={vehicle.vehicle_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-2.5">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                              <td className="py-2.5 text-muted-foreground">{vehicle.license_plate}</td>
                              <td className="text-right py-2.5">{vehicle.total_rentals}</td>
                              <td className="text-right py-2.5">{vehicle.days_rented?.toFixed(0) || 0}</td>
                              <td className="text-right py-2.5">
                                <Badge
                                  variant={
                                    (vehicle.utilization_rate || 0) > 70
                                      ? 'default'
                                      : (vehicle.utilization_rate || 0) > 30
                                        ? 'secondary'
                                        : 'outline'
                                  }
                                >
                                  {vehicle.utilization_rate?.toFixed(1) || 0}%
                                </Badge>
                              </td>
                              <td className="text-right py-2.5 font-semibold">{formatCurrency(vehicle.total_revenue || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* ─── Customers Tab ─── */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t('reports.customer_analytics'), value: customerData.length.toString() },
                  { label: t('reports.segment'), value: customerData.filter((c) => c.customer_segment === 'VIP').length.toString() },
                  { label: t('reports.avg_value'), value: customerData.length > 0 ? formatCurrency(customerData.reduce((s, c) => s + (c.total_spent || 0), 0) / customerData.length) : '0 MAD' },
                  { label: t('reports.total_spent'), value: formatCurrency(customerData.reduce((s, c) => s + (c.total_spent || 0), 0)) },
                ].map((stat, i) => (
                  <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.02 }}>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                    <CardHeader>
                      <CardTitle>{t('reports.customer_analytics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {customerData.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">{t('reports.no_customers')}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium text-muted-foreground">Customer</th>
                              <th className="text-left py-2 font-medium text-muted-foreground">Phone</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Rentals</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Total Spent</th>
                              <th className="text-right py-2 font-medium text-muted-foreground">Avg Value</th>
                              <th className="text-left py-2 font-medium text-muted-foreground">Segment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerData.slice(0, 50).map((customer) => (
                              <tr key={customer.customer_id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="py-2.5">{customer.full_name}</td>
                                <td className="py-2.5 text-muted-foreground">{customer.phone}</td>
                                <td className="text-right py-2.5">{customer.total_rentals}</td>
                                <td className="text-right py-2.5 font-semibold">{formatCurrency(customer.total_spent || 0)}</td>
                                <td className="text-right py-2.5">{formatCurrency(customer.avg_rental_value || 0)}</td>
                                <td className="py-2.5">
                                  <Badge
                                    variant={
                                      customer.customer_segment === 'VIP'
                                        ? 'default'
                                        : customer.customer_segment === 'Regular'
                                          ? 'secondary'
                                          : 'outline'
                                    }
                                  >
                                    {customer.customer_segment}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* ─── Rentals Tab ─── */}
          {activeTab === 'rentals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {rentalStatus.map((status, i) => (
                  <motion.div key={status.status} custom={i} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.02 }}>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: RENTAL_STATUS_COLORS[status.status] || CHART_COLORS.blue }}
                          />
                          <p className="text-sm text-muted-foreground capitalize">{status.status}</p>
                        </div>
                        <p className="text-2xl font-bold mt-1">{status.count}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(status.avg_value || 0)} avg</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Donut Chart */}
              <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('reports.rental_status')} {t('reports.status_breakdown')}</CardTitle>
                    <CardDescription>{t('reports.current_distribution')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {rentalStatus.length === 0 ? (
                      <p className="text-muted-foreground text-center py-10">{t('reports.no_data')}</p>
                    ) : (
                      <div className="flex flex-col lg:flex-row items-center gap-8">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={rentalStatus.map((s) => ({ name: s.status, value: s.count || 0 }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={110}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {rentalStatus.map((entry) => (
                                <Cell
                                  key={entry.status}
                                  fill={RENTAL_STATUS_COLORS[entry.status] || CHART_COLORS.blue}
                                  stroke="hsl(var(--background))"
                                  strokeWidth={3}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomDonutTooltip />} />
                            <Legend content={<CustomLegend />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col gap-3 min-w-[200px]">
                          {rentalStatus.map((s) => {
                            const total = rentalStatus.reduce((acc, r) => acc + (r.count || 0), 0)
                            const pct = total > 0 ? ((s.count || 0) / total * 100).toFixed(1) : '0'
                            return (
                              <div key={s.status} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: RENTAL_STATUS_COLORS[s.status] || CHART_COLORS.blue }}
                                  />
                                  <span className="text-sm capitalize">{s.status}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-semibold">{s.count}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({pct}%)</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status bars */}
              <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('reports.status_breakdown')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rentalStatus.map((status) => {
                        const total = rentalStatus.reduce((s, r) => s + (r.count || 0), 0)
                        const pct = total > 0 ? ((status.count || 0) / total) * 100 : 0
                        return (
                          <div key={status.status}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: RENTAL_STATUS_COLORS[status.status] || CHART_COLORS.blue }}
                                />
                                <span className="text-sm font-medium capitalize">{status.status}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {status.count} <span className="text-xs">({pct.toFixed(1)}%)</span>
                              </span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: RENTAL_STATUS_COLORS[status.status] || CHART_COLORS.blue }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </>
      )}
      </main>
    </PageTransition>
  )
}
