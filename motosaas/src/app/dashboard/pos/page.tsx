'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart, Plus, Trash2, CreditCard, Banknote, Smartphone, Receipt, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface PosItem {
  id: string
  name: string
  category: string
  price: number
  stock: number
}

interface CartItem {
  item: PosItem
  quantity: number
}

const CATEGORIES = ['accessories', 'fuel', 'services', 'insurance']
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
]

export default function PosPage() {
  const { t } = useI18n()
  const [items, setItems] = useState<PosItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number; paymentMethod: string; date: string } | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    category: 'accessories',
    price: '',
    stock: '',
  })

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) { setLoading(false); return }

    const { data } = await supabase
      .from('pos_items')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('name')

    if (data) setItems(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const { error } = await supabase.from('pos_items').insert({
      tenant_id: userData.tenant_id,
      name: form.name,
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
    })

    if (!error) {
      setDialogOpen(false)
      setForm({ name: '', category: 'accessories', price: '', stock: '' })
      toast.success('Item added successfully!')
      fetchItems()
    } else {
      toast.error('Failed to add item')
    }
    setSubmitting(false)
  }

  function addToCart(item: PosItem) {
    const existing = cart.find(c => c.item.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { item, quantity: 1 }])
    }
  }

  function removeFromCart(itemId: string) {
    setCart(cart.filter(c => c.item.id !== itemId))
  }

  function updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(c => c.item.id === itemId ? { ...c, quantity } : c))
    }
  }

  async function processSale() {
    if (cart.length === 0) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData) return

    const total = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)

    const { error } = await supabase.from('pos_transactions').insert({
      tenant_id: userData.tenant_id,
      items: cart.map(c => ({ item_id: c.item.id, name: c.item.name, price: c.item.price, quantity: c.quantity })),
      total,
      payment_method: paymentMethod,
    })

    if (!error) {
      setLastSale({
        items: [...cart],
        total,
        paymentMethod,
        date: new Date().toISOString(),
      })
      setShowReceipt(true)
      toast.success('Sale completed successfully!')
      setCart([])
    } else {
      toast.error('Failed to process sale')
    }
    setSubmitting(false)
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchSearch && matchCategory
  })

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Quick-sale interface for walk-in customers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/25" />}>
            <Plus className="w-4 h-4" />
            Add Item
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add POS Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (MAD)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Add Item'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-gray-50 border-gray-200 rounded-xl"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addToCart(item)}>
                  <CardContent className="p-4">
                    <Badge variant="secondary" className="mb-2 text-xs">{item.category}</Badge>
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{item.price?.toLocaleString()} MAD</p>
                    <p className="text-xs text-muted-foreground mt-1">Stock: {item.stock}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((c) => (
                      <div key={c.item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.item.name}</p>
                          <p className="text-xs text-muted-foreground">{c.item.price} MAD x {c.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(c.item.id, c.quantity - 1)}>-</Button>
                          <span className="text-sm font-medium w-6 text-center">{c.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(c.item.id, c.quantity + 1)}>+</Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(c.item.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-emerald-600">{cartTotal.toLocaleString()} MAD</span>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((pm) => (
                          <Button
                            key={pm.value}
                            variant={paymentMethod === pm.value ? 'default' : 'outline'}
                            className={paymentMethod === pm.value ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                            onClick={() => setPaymentMethod(pm.value)}
                          >
                            <pm.icon className="w-4 h-4 mr-1" />
                            <span className="text-xs">{pm.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={processSale}
                      disabled={submitting || cart.length === 0}
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      {submitting ? 'Processing...' : 'Complete Sale'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sale Complete</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <Receipt className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{new Date(lastSale.date).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                {lastSale.items.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{c.item.name} x{c.quantity}</span>
                    <span>{(c.item.price * c.quantity).toLocaleString()} MAD</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">{lastSale.total.toLocaleString()} MAD</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Paid via {lastSale.paymentMethod}</p>
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setShowReceipt(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
