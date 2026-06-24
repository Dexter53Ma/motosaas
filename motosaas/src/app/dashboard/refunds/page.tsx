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
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface Refund {
  id: string
  payment_id: string
  customer_id: string
  rental_id: string
  amount: number
  reason: string
  requested_date: string
  processed_date: string | null
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  approved_by: string | null
  customer?: { full_name: string }
  rental?: { id: string; vehicles?: { make: string; model: string } }
}

const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
  processed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

export default function RefundsPage() {
  const { t } = useI18n()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { fetchRefunds() }, [])

  async function fetchRefunds() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data: refundsData } = await supabase
      .from('refunds')
      .select('*, customer:customers(full_name), rental:rentals(id, vehicles(make, model))')
      .eq('tenant_id', userData.tenant_id)
      .order('requested_date', { ascending: false })

    if (refundsData) setRefunds(refundsData)
    setLoading(false)
  }

  async function handleApprove(refund: Refund) {
    setProcessingId(refund.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('refunds')
      .update({
        status: 'approved',
        approved_by: user?.id || null,
        processed_date: new Date().toISOString(),
      })
      .eq('id', refund.id)
    if (error) toast.error(error.message)
    else toast.success('Refund approved')
    fetchRefunds()
    setProcessingId(null)
  }

  async function handleReject(refund: Refund) {
    setProcessingId(refund.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('refunds')
      .update({
        status: 'rejected',
        approved_by: user?.id || null,
        processed_date: new Date().toISOString(),
      })
      .eq('id', refund.id)
    if (error) toast.error(error.message)
    else toast.success('Refund rejected')
    fetchRefunds()
    setProcessingId(null)
  }

  async function handleProcess(refund: Refund) {
    setProcessingId(refund.id)
    const { error } = await supabase
      .from('refunds')
      .update({ status: 'processed', processed_date: new Date().toISOString() })
      .eq('id', refund.id)
    if (error) toast.error(error.message)
    else toast.success('Refund processed')
    fetchRefunds()
    setProcessingId(null)
  }

  const filtered = refunds.filter(r => {
    const matchSearch = !searchQuery ||
      r.customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingRefunds = refunds.filter(r => r.status === 'pending')
  const approvedRefunds = refunds.filter(r => r.status === 'approved')
  const totalRefundAmount = refunds.reduce((s, r) => s + (r.amount || 0), 0)
  const pendingAmount = pendingRefunds.reduce((s, r) => s + (r.amount || 0), 0)

  return (
    <PageTransition>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("refunds.title")}</h1>
            <p className="text-gray-600">{t("refunds.desc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign className="size-4" />
                <p className="text-sm">{t("refunds.total_refunds")}</p>
              </div>
              <p className="text-2xl font-bold">{refunds.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="size-4" />
                <p className="text-sm">{t("refunds.pending")}</p>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{pendingRefunds.length}</p>
              <p className="text-sm text-gray-500">{pendingAmount.toLocaleString()} MAD</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <CheckCircle className="size-4" />
                <p className="text-sm">{t("refunds.approved")}</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{approvedRefunds.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <AlertTriangle className="size-4" />
                <p className="text-sm">{t("refunds.total_amount")}</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{totalRefundAmount.toLocaleString()} MAD</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-4">
          <Input
            type="text"
            placeholder="Search by customer or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("refunds.all_status")}</SelectItem>
              <SelectItem value="pending">{t("refunds.pending")}</SelectItem>
              <SelectItem value="approved">{t("refunds.approved")}</SelectItem>
              <SelectItem value="rejected">{t("refunds.rejected")}</SelectItem>
              <SelectItem value="processed">{t("refunds.processed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("refunds.requests")}</CardTitle>
            <CardDescription>{t("refunds.requests_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("refunds.loading")}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t("refunds.empty")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((refund) => {
                    const statusConfig = STATUS_CONFIG[refund.status] || STATUS_CONFIG.pending
                    const StatusIcon = statusConfig.icon
                    return (
                      <TableRow key={refund.id}>
                        <TableCell className="font-medium">
                          {refund.customer?.full_name}
                        </TableCell>
                        <TableCell>
                          {refund.rental?.vehicles?.make} {refund.rental?.vehicles?.model}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {refund.amount?.toLocaleString()} MAD
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                          {refund.reason || 'â€”'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {refund.requested_date ? new Date(refund.requested_date).toLocaleDateString('fr-FR') : 'â€”'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="size-3 mr-1" />
                            {refund.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {refund.status === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleApprove(refund)}
                                disabled={processingId === refund.id}
                                className="bg-[#10b981] hover:bg-[#059669] text-white"
                              >
                                <CheckCircle className="size-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(refund)}
                                disabled={processingId === refund.id}
                              >
                                <XCircle className="size-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {refund.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => handleProcess(refund)}
                              disabled={processingId === refund.id}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Process
                            </Button>
                          )}
                          {(refund.status === 'rejected' || refund.status === 'processed') && (
                            <span className="text-sm text-gray-400">â€”</span>
                          )}
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
