'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string | null
  id_number: string | null
  address: string | null
  tags: string[]
  loyalty_score: number
  notes: string | null
  created_at: string
}

interface Rental {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  vehicles: {
    make: string
    model: string
    year: number
    license_plate: string
  }
}

interface Note {
  id: string
  note: string
  created_at: string
  users: {
    full_name: string
  }
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [rentals, setRentals] = useState<Rental[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [addingNote, setAddingNote] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getCustomer = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (data) {
        setCustomer(data)
      }

      // Get rental history
      const { data: rentalData } = await supabase
        .from('rentals')
        .select('*, vehicles(make, model, year, license_plate)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (rentalData) {
        setRentals(rentalData as Rental[])
      }

      // Get notes
      const { data: noteData } = await supabase
        .from('customer_notes')
        .select('*, users(full_name)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (noteData) {
        setNotes(noteData as Note[])
      }

      setLoading(false)
    }

    getCustomer()
  }, [id, supabase])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error deleting customer: ' + error.message)
    } else {
      router.push('/dashboard/customers')
      router.refresh()
    }
    setDeleting(false)
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setAddingNote(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userProfile } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) return

    const { error } = await supabase
      .from('customer_notes')
      .insert({
        tenant_id: userProfile.tenant_id,
        customer_id: id,
        note: newNote,
        created_by: user.id,
      })

    if (!error) {
      setNewNote('')
      // Refresh notes
      const { data: noteData } = await supabase
        .from('customer_notes')
        .select('*, users(full_name)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (noteData) {
        setNotes(noteData as Note[])
      }
    }
    setAddingNote(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return

    const { error } = await supabase
      .from('customer_notes')
      .delete()
      .eq('id', noteId)

    if (!error) {
      setNotes(notes.filter(n => n.id !== noteId))
    }
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'vip': return 'bg-purple-100 text-purple-800'
      case 'blacklisted': return 'bg-red-100 text-red-800'
      case 'regular': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRentalStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalSpent = rentals.reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const totalRentals = rentals.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Customer not found</h2>
        <Link href="/dashboard/customers" className="text-blue-600 hover:underline mt-4 block">
          Back to customers
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/dashboard/customers" className="text-blue-600 hover:underline text-sm mb-2 block">
            ← Back to customers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{customer.full_name}</h1>
          <p className="text-gray-600">{customer.phone}</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/dashboard/customers/${id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Full Name</dt>
                <dd className="text-sm font-medium text-gray-900">{customer.full_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-gray-900">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-sm font-medium text-gray-900">{customer.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">ID Number</dt>
                <dd className="text-sm font-medium text-gray-900">{customer.id_number || 'N/A'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">Address</dt>
                <dd className="text-sm font-medium text-gray-900">{customer.address || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          {/* Rental History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Rental History</h2>
            {rentals.length === 0 ? (
              <p className="text-gray-500">No rental history yet</p>
            ) : (
              <div className="space-y-4">
                {rentals.map((rental) => (
                  <div key={rental.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {rental.vehicles?.year} {rental.vehicles?.make} {rental.vehicles?.model}
                        </p>
                        <p className="text-sm text-gray-500">
                          {rental.vehicles?.license_plate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{rental.total_amount.toLocaleString()} MAD</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRentalStatusColor(rental.status)}`}>
                          {rental.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Internal Notes</h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a note about this customer..."
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="text-gray-500">No notes yet</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900">{note.note}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          By {note.users?.full_name || 'Unknown'} on {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {customer.tags?.length === 0 ? (
                <p className="text-gray-500">No tags</p>
              ) : (
                customer.tags?.map((tag) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Rentals</span>
                <span className="font-medium">{totalRentals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-medium">{totalSpent.toLocaleString()} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Loyalty Score</span>
                <span className="font-medium">{customer.loyalty_score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer Since</span>
                <span className="font-medium">
                  {new Date(customer.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/rentals/new?customer=${id}`}
                className="block w-full text-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Create Rental
              </Link>
              <a
                href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-600"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
