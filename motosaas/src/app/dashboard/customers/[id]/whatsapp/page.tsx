'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getMessageHistory, sendMessage, openWhatsAppChat, type WhatsAppMessage } from '@/lib/whatsapp'

export default function CustomerWhatsAppPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => { fetchData() }, [params.id])

  async function fetchData() {
    setLoading(true)

    // Get customer info
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single()

    if (customerData) setCustomer(customerData)

    // Get message history
    try {
      const history = await getMessageHistory(params.id as string)
      setMessages(history)
    } catch (err: any) {
      console.error('Error fetching messages:', err)
    }

    setLoading(false)
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !customer) return

    setSending(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      if (!userData) throw new Error('No tenant found')

      await sendMessage({
        tenant_id: userData.tenant_id,
        customer_id: customer.id,
        content: newMessage,
      })

      setNewMessage('')
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleOpenWhatsApp() {
    if (!customer?.phone) {
      alert('No phone number available for this customer')
      return
    }
    openWhatsAppChat(customer.phone)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Customer not found</p>
      </div>
    )
  }

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
                <Link href="/dashboard/payments" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Payments</Link>
                <Link href="/dashboard/whatsapp" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">WhatsApp</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">&larr; Back</button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Chat</h1>
              <p className="text-gray-600">{customer.first_name} {customer.last_name}</p>
            </div>
          </div>
          <button
            onClick={handleOpenWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Open in WhatsApp
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600">
                {customer.first_name?.[0]}{customer.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="font-medium">{customer.first_name} {customer.last_name}</p>
              <p className="text-sm text-gray-500">{customer.phone}</p>
              {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
            </div>
          </div>
        </div>

        {/* Message History */}
        <div className="bg-white rounded-lg shadow mb-4" style={{ height: '400px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Send your first message below.
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {[...messages].reverse().map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.direction === 'outgoing'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <div className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.direction === 'outgoing' && (
                        <span className="ml-2">
                          {msg.status === 'sent' && '✓'}
                          {msg.status === 'delivered' && '✓✓'}
                          {msg.status === 'read' && '✓✓'}
                          {msg.status === 'failed' && '✗'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={sending}
            />
            <button
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}