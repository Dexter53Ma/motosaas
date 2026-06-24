'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit, MapPin } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function LocationsPage() {
  const { t } = useI18n()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    is_main: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData?.tenant_id) { setLoading(false); return }
      setTenantId(userData.tenant_id)
      await fetchLocations(userData.tenant_id)
    }
    init()
  }, [])

  async function fetchLocations(tid?: string) {
    setLoading(true)

    let query = supabase
      .from('locations')
      .select('*')

    if (tid) query = query.eq('tenant_id', tid)

    const { data } = await query
      .order('is_main', { ascending: false })
      .order('name')

    if (data) setLocations(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase
        .from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      const locationData = {
        tenant_id: userData.tenant_id,
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        is_main: formData.is_main,
      }

      if (editingLocation) {
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('locations')
          .insert(locationData)

        if (error) throw error
      }

      setShowForm(false)
      setEditingLocation(null)
      setFormData({ name: '', address: '', city: '', phone: '', email: '', is_main: false })
      if (tenantId) await fetchLocations(tenantId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(location: any) {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      phone: location.phone || '',
      email: location.email || '',
      is_main: location.is_main,
    })
    setShowForm(true)
  }

  async function deleteLocation(id: string) {
    if (!confirm('Delete this location? Vehicles and rentals will be unlinked.')) return

    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (!error && tenantId) await fetchLocations(tenantId)
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('locations')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error && tenantId) await fetchLocations(tenantId)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>
  }

  return (
    <PageTransition>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle>{editingLocation ? t('locations.edit') : t('locations.add')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.name')} *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Main Shop"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.address')}</label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.city')}</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g., Casablanca"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.phone')}</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+212 6XX-XXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('locations.email')}</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="location@example.com"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_main"
                    checked={formData.is_main}
                    onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                    className="h-4 w-4 text-emerald-500 rounded"
                  />
                  <label htmlFor="is_main" className="text-sm text-gray-700">{t('locations.main')}</label>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={saving || !formData.name}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {saving ? t('common.loading') : editingLocation ? t('common.edit') : t('common.create')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setShowForm(false); setEditingLocation(null); setError('') }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('locations.title')}</h1>
        </div>
        <Button
          onClick={() => { setShowForm(true); setEditingLocation(null); setFormData({ name: '', address: '', city: '', phone: '', email: '', is_main: false }) }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="size-4 mr-2" />
          {t('locations.add')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-emerald-500" />
                    <h3 className="font-medium">{location.name}</h3>
                    {location.is_main && (
                      <Badge className="bg-emerald-100 text-emerald-800">{t('locations.main_badge')}</Badge>
                    )}
                  </div>
                  {location.address && (
                    <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                  )}
                  {location.city && (
                    <p className="text-sm text-gray-600">{location.city}</p>
                  )}
                  {location.phone && (
                    <p className="text-sm text-gray-500 mt-2">{location.phone}</p>
                  )}
                  {location.email && (
                    <p className="text-sm text-gray-500">{location.email}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => startEdit(location)}>
                  <Edit className="size-3 mr-1" />
                  {t('common.edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={location.is_active ? 'text-emerald-600 border-emerald-300' : 'text-gray-600'}
                  onClick={() => toggleActive(location.id, location.is_active)}
                >
                  {location.is_active ? t('locations.active') : t('locations.inactive')}
                </Button>
                {!location.is_main && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => deleteLocation(location.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">{t('locations.empty')}</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Add Your First Location
          </Button>
        </div>
      )}
    </PageTransition>
  )
}
