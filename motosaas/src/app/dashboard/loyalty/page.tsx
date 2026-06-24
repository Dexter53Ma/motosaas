'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Award, Users, TrendingUp, Gift, Star, Trophy } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface LoyaltyCustomer {
  customer_id: string
  full_name: string
  phone: string
  points_earned: number
  points_redeemed: number
  total_spent: number
  loyalty_tier: string
  join_date: string
}

const TIER_CONFIG: Record<string, { color: string; icon: string; min: number }> = {
  bronze: { color: 'bg-orange-100 text-orange-800', icon: 'ðŸ¥‰', min: 0 },
  silver: { color: 'bg-gray-100 text-gray-800', icon: 'ðŸ¥ˆ', min: 500 },
  gold: { color: 'bg-yellow-100 text-yellow-800', icon: 'ðŸ¥‡', min: 2000 },
  platinum: { color: 'bg-purple-100 text-purple-800', icon: 'ðŸ’Ž', min: 5000 },
}

function getTier(totalSpent: number): string {
  if (totalSpent >= 5000) return 'platinum'
  if (totalSpent >= 2000) return 'gold'
  if (totalSpent >= 500) return 'silver'
  return 'bronze'
}

export default function LoyaltyPage() {
  const { t } = useI18n()
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => { fetchLoyaltyData() }, [])

  async function fetchLoyaltyData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: rentalsData } = await supabase
      .from('rentals')
      .select('customer_id, total_amount, customers(id, full_name, phone, created_at)')
      .eq('tenant_id', userData.tenant_id)

    if (rentalsData) {
      const customerMap = new Map<string, LoyaltyCustomer>()
      rentalsData.forEach((rental: any) => {
        const cust = rental.customers
        if (!cust) return
        if (!customerMap.has(cust.id)) {
          customerMap.set(cust.id, {
            customer_id: cust.id,
            full_name: cust.full_name,
            phone: cust.phone,
            points_earned: 0,
            points_redeemed: 0,
            total_spent: 0,
            loyalty_tier: 'bronze',
            join_date: cust.created_at,
          })
        }
        const entry = customerMap.get(cust.id)!
        entry.total_spent += rental.total_amount || 0
        entry.points_earned = Math.floor(entry.total_spent / 10)
        entry.loyalty_tier = getTier(entry.total_spent)
      })
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.points_earned - a.points_earned))
    }
    setLoading(false)
  }

  const filtered = customers.filter(c => {
    const matchSearch = !searchQuery ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    const matchTier = tierFilter === 'all' || c.loyalty_tier === tierFilter
    return matchSearch && matchTier
  })

  const totalPoints = customers.reduce((s, c) => s + c.points_earned, 0)
  const tierCounts = customers.reduce((acc, c) => {
    acc[c.loyalty_tier] = (acc[c.loyalty_tier] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("loyalty.title")}</h1>
            <p className="text-gray-600">{t("loyalty.desc")} — 1 point per 10 MAD spent</p>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-[#10b981]" />
            <span className="text-sm text-gray-500">{t("loyalty.redeem_note")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="size-4" />
                <p className="text-sm">{t("loyalty.total_members")}</p>
              </div>
              <p className="text-2xl font-bold">{customers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-[#10b981] mb-1">
                <Star className="size-4" />
                <p className="text-sm">{t("loyalty.total_points")}</p>
              </div>
              <p className="text-2xl font-bold text-[#10b981]">{totalPoints.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Trophy className="size-4" />
                <p className="text-sm">{t("loyalty.gold_plus")}</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {(tierCounts.gold || 0) + (tierCounts.platinum || 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="size-4" />
                <p className="text-sm">{t("loyalty.avg_spend")}</p>
              </div>
              <p className="text-2xl font-bold">
                {customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.total_spent, 0) / customers.length).toLocaleString() : 0} MAD
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 mb-2">{t("loyalty.tier_distribution")}</p>
              <div className="flex gap-1">
                {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                  <div key={tier} className="flex-1 text-center">
                    <div className="text-lg">{config.icon}</div>
                    <div className="text-xs font-bold">{tierCounts[tier] || 0}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={tierFilter} onValueChange={(v) => v && setTierFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("loyalty.all_tiers")}</SelectItem>
              <SelectItem value="bronze">{t("loyalty.bronze")}</SelectItem>
              <SelectItem value="silver">{t("loyalty.silver")}</SelectItem>
              <SelectItem value="gold">{t("loyalty.gold")}</SelectItem>
              <SelectItem value="platinum">{t("loyalty.platinum")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("loyalty.leaderboard")}</CardTitle>
            <CardDescription>{t("loyalty.leaderboard_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("loyalty.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t("loyalty.empty")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Points Earned</TableHead>
                    <TableHead>Points Redeemed</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Join Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((customer, index) => {
                    const tier = TIER_CONFIG[customer.loyalty_tier] || TIER_CONFIG.bronze
                    return (
                      <TableRow key={customer.customer_id}>
                        <TableCell className="font-bold text-gray-400">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {customer.full_name}
                        </TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>
                          <Badge className={tier.color}>
                            {tier.icon} {customer.loyalty_tier}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.total_spent.toLocaleString()} MAD</TableCell>
                        <TableCell className="font-medium text-[#10b981]">
                          {customer.points_earned.toLocaleString()}
                        </TableCell>
                        <TableCell>{customer.points_redeemed.toLocaleString()}</TableCell>
                        <TableCell>
                          {(customer.points_earned - customer.points_redeemed).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {customer.join_date ? new Date(customer.join_date).toLocaleDateString('fr-FR') : 'â€”'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
