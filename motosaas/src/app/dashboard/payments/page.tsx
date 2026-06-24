'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payment {
  id: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number?: string
  notes?: string
  rental?: {
    id: string
    vehicle?: { make: string; model: string; year: number }
  }
  customer?: {
    id: string
    first_name: string
    last_name: string
    phone: string
  }
}

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-green-100 text-green-800',
  card: 'bg-blue-100 text-blue-800',
  bank_transfer: 'bg-purple-100 text-purple-800',
  mobile_money: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [stats, setStats] = useState({ totalRevenue: 0, todayRevenue: 0, monthRevenue: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { fetchPayments() }, [])

  async function fetchPayments() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, rental:rentals(id, vehicle:vehicles(make, model, year)), customer:customers(id, first_name, last_name, phone)')
      .eq('tenant_id', userData.tenant_id)
      .order('payment_date', { ascending: false })

    if (paymentsData) {
      setPayments(paymentsData)
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)
      setStats({
        totalRevenue: paymentsData.reduce((s, p) => s + (p.amount || 0), 0),
        todayRevenue: paymentsData.filter(p => p.payment_date?.startsWith(today)).reduce((s, p) => s + (p.amount || 0), 0),
        monthRevenue: paymentsData.filter(p => p.payment_date?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0),
      })
    }
    setLoading(false)
  }

  const filtered = payments.filter(p => {
    const matchSearch = !searchQuery ||
      p.customer?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customer?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchMethod = methodFilter === 'all' || p.payment_method === methodFilter
    return matchSearch && matchMethod
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Dashboard</Link>
                <Link href="/dashboard/vehicles" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Vehicles</Link>
                <Link href="/dashboard/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Customers</Link>
                <Link href="/dashboard/rentals" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Rentals</Link>
                <Link href="/dashboard/payments" className="text-gray-900 font-semibold px-3 py-2 text-sm">Payments</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Track all payments and revenue</p>
          </div>
          <Link href="/dashboard/payments/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            + Record Payment
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} MAD</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-2xl font-bold text-green-600">{stats.todayRevenue.toLocaleString()} MAD</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-blue-600">{stats.monthRevenue.toLocaleString()} MAD</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Transactions</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <input
            type="text" placeholder="Search by customer or reference..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No payments found</div>
          ) : (
            <div className="divide-y">
              {filtered.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => router.push(`/dashboard/payments/${payment.id}`)}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${METHOD_COLORS[payment.payment_method] || 'bg-gray-100 text-gray-800'}`}>
                      {payment.payment_method.replace('_', ' ')}
                    </span>
                    <div>
                      <p className="font-medium">{payment.customer?.first_name} {payment.customer?.last_name}</p>
                      <p className="text-sm text-gray-500">
                        {payment.rental?.vehicle?.make} {payment.rental?.vehicle?.model}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{payment.amount?.toLocaleString()} MAD</p>
                    <p className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}