'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, Search, Plus, Edit, Trash2, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  color: string | null
  mileage: number
  purchase_price: number | null
  daily_rate: number
  status: string
  fuel_type: string
  photo_url?: string
}

const cardColors = [
  'from-emerald-400 to-teal-500',
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
]

export default function VehiclesPage() {
  const { t } = useI18n()

  const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
    available: { label: t('vehicles.available'), dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rented: { label: t('vehicles.rented'), dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
    maintenance: { label: t('vehicles.maintenance'), dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    retired: { label: t('vehicles.retired'), dot: 'bg-gray-400', bg: 'bg-gray-50 text-gray-600 border-gray-200' },
  }

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (userData) setTenantId(userData.tenant_id)
    }
    init()
  }, [supabase])

  useEffect(() => {
    if (!tenantId) return

    const getVehicles = async () => {
      let query = supabase.from('vehicles').select('*').eq('tenant_id', tenantId)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (search) {
        query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,license_plate.ilike.%${search}%`)
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data } = await query
      if (data) setVehicles(data)
      setLoading(false)
    }

    getVehicles()
  }, [supabase, search, statusFilter, sortBy, sortOrder, tenantId])

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    rented: vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    totalValue: vehicles.reduce((sum, v) => sum + (v.purchase_price || 0), 0),
  }

  const statCards = [
    { label: t('common.total'), value: String(stats.total), color: 'from-gray-600 to-gray-800', icon: '🏷️' },
    { label: t('vehicles.available'), value: String(stats.available), color: 'from-emerald-500 to-emerald-700', icon: '✅' },
    { label: t('vehicles.rented'), value: String(stats.rented), color: 'from-blue-500 to-blue-700', icon: '🔑' },
    { label: t('vehicles.maintenance'), value: String(stats.maintenance), color: 'from-amber-500 to-amber-700', icon: '🔧' },
    { label: t('vehicles.fleet_value'), value: `${stats.totalValue.toLocaleString()} MAD`, color: 'from-purple-500 to-purple-700', icon: '💰' },
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('vehicles.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('vehicles.manage_fleet')}</p>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              render={<Link href="/dashboard/vehicles/new" />}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 rounded-xl px-5 py-2.5 font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('vehicles.add')}
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            >
              <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className={cn('h-1.5 bg-gradient-to-r', stat.color)} />
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{stat.icon}</span>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                  <p className={cn('text-xl font-bold', stat.color.replace('from-', 'text-').replace(' to-', ' '))}>
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('vehicles.search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 rounded-xl focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      'rounded-xl border-gray-200 bg-gray-50',
                      showFilters && 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    {t('common.filter')}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bg-gray-50 border-gray-200 rounded-xl"
                  >
                    <motion.div
                      animate={{ rotate: sortOrder === 'asc' ? 0 : 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7-7 7 7" />
                      </svg>
                    </motion.div>
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-gray-100">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">{t('common.status')}</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                        >
                          <option value="all">{t('vehicles.all_status')}</option>
                          <option value="available">{t('vehicles.available')}</option>
                          <option value="rented">{t('vehicles.rented')}</option>
                          <option value="maintenance">{t('vehicles.maintenance')}</option>
                          <option value="retired">{t('vehicles.retired')}</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">{t('vehicles.sort_by')}</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                        >
                          <option value="created_at">{t('vehicles.date_added')}</option>
                          <option value="make">{t('vehicles.make')}</option>
                          <option value="model">{t('vehicles.model')}</option>
                          <option value="year">{t('vehicles.year')}</option>
                          <option value="daily_rate">{t('vehicles.daily_rate')}</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              <Car className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <Car className="w-10 h-10 text-emerald-400" />
                  </div>
                </motion.div>
              </div>
              <CardContent className="py-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('vehicles.no_vehicles')}</h3>
                <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
                  {t('vehicles.empty_state')}
                </p>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button
                    render={<Link href="/dashboard/vehicles/new" />}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 rounded-xl px-6 py-2.5 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    {t('vehicles.add_first')}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle, i) => {
              const config = statusConfig[vehicle.status] || statusConfig.available
              const gradient = cardColors[i % cardColors.length]

              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-sm h-full">
                    {/* Image Area */}
                    <div className={cn(
                      'h-44 bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
                      gradient
                    )}>
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                      <Car className="w-16 h-16 text-white/80 group-hover:text-white/90 transition-colors relative z-10" />
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm bg-white/90',
                          config.bg
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            config.dot,
                            vehicle.status === 'available' && 'animate-pulse'
                          )} />
                           {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {vehicle.year} • {vehicle.license_plate}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <span className="text-emerald-600 font-bold text-lg">
                          {vehicle.daily_rate} MAD
                          <span className="text-xs font-normal text-gray-400 ml-0.5">/day</span>
                        </span>
                        {vehicle.mileage > 0 && (
                          <span className="text-gray-400 text-xs">
                            {vehicle.mileage.toLocaleString()} km
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={`/dashboard/vehicles/${vehicle.id}/edit`} />}
                            className="w-full rounded-lg border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            {t('common.edit')}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            onClick={() => {
                              if (confirm('Delete this vehicle?')) {
                                supabase.from('vehicles').delete().eq('id', vehicle.id).then(({ error }) => {
                                  if (!error) {
                                    setVehicles(vehicles.filter(v => v.id !== vehicle.id))
                                  }
                                })
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('common.delete')}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
