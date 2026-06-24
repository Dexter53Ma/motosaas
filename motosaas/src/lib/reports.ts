import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface RevenueReport {
  report_date: string
  transaction_count: number
  total_revenue: number
  cash_revenue: number
  card_revenue: number
  bank_transfer_revenue: number
  mobile_money_revenue: number
}

export interface VehicleUtilization {
  vehicle_id: string
  make: string
  model: string
  year: number
  license_plate: string
  total_rentals: number
  days_rented: number
  utilization_rate: number
  total_revenue: number
}

export interface CustomerAnalytics {
  customer_id: string
  full_name: string
  phone: string
  total_rentals: number
  total_spent: number
  avg_rental_value: number
  first_rental_date: string
  last_rental_date: string
  customer_segment: string
}

export interface DashboardStats {
  total_vehicles: number
  available_vehicles: number
  rented_vehicles: number
  maintenance_vehicles: number
  total_customers: number
  active_rentals: number
  pending_payments: number
  total_revenue: number
  monthly_revenue: number
  overdue_rentals: number
}

export async function getRevenueReport(tenantId: string, startDate?: string, endDate?: string): Promise<RevenueReport[]> {
  const { data, error } = await supabase
    .rpc('get_revenue_report', {
      p_tenant_id: tenantId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    })

  if (error) throw error
  return data || []
}

export async function getVehicleUtilizationReport(tenantId: string): Promise<VehicleUtilization[]> {
  const { data, error } = await supabase
    .rpc('get_vehicle_utilization_report', { p_tenant_id: tenantId })

  if (error) throw error
  return data || []
}

export async function getCustomerAnalyticsReport(tenantId: string): Promise<CustomerAnalytics[]> {
  const { data, error } = await supabase
    .rpc('get_customer_analytics_report', { p_tenant_id: tenantId })

  if (error) throw error
  return data || []
}

export async function getDashboardStats(tenantId: string): Promise<DashboardStats | null> {
  const { data, error } = await supabase
    .rpc('get_dashboard_stats', { p_tenant_id: tenantId })

  if (error) throw error
  return data?.[0] || null
}

export async function getMonthlyRevenue(tenantId: string) {
  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('month', { ascending: false })
    .limit(12)

  if (error) throw error
  return data || []
}

export async function getRentalStatusDistribution(tenantId: string) {
  const { data, error } = await supabase
    .from('rental_status_distribution')
    .select('*')
    .eq('tenant_id', tenantId)

  if (error) throw error
  return data || []
}

export function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`
      return value
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export function downloadCSV(data: any[], filename: string) {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
  }).format(amount) + ' MAD'
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value / 100)
}