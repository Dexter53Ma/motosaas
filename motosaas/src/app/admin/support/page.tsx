'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Ticket {
  id: string
  tenant_id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  tenant?: { name: string; email: string }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const supabase = createClient()

  useEffect(() => { fetchTickets() }, [])

  async function fetchTickets() {
    setLoading(true)
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, tenant:tenants(name, email)')
      .order('created_at', { ascending: false })

    if (!error && data) setTickets(data)
    setLoading(false)
  }

  async function handleUpdateStatus(ticketId: string, status: string) {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (!error) {
      await fetchTickets()
      setShowModal(false)
    }
  }

  async function handleSendReply() {
    if (!selectedTicket || !replyMessage.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: 'admin',
        message: replyMessage,
      })

    if (!error) {
      setReplyMessage('')
      await fetchTickets()
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    return statusFilter === 'all' || ticket.status === statusFilter
  })

  const ticketCount = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600">Manage customer support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-blue-600">{ticketCount.open}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{ticketCount.in_progress}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{ticketCount.resolved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Closed</p>
          <p className="text-2xl font-bold text-gray-600">{ticketCount.closed}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">Subject</th>
                  <th className="text-left py-3 px-4">Tenant</th>
                  <th className="text-left py-3 px-4">Priority</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Created</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ticket.subject}</td>
                    <td className="py-3 px-4 text-gray-600">{ticket.tenant?.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setSelectedTicket(ticket); setShowModal(true) }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">{selectedTicket.subject}</h2>
              <div className="space-y-3 mb-4">
                <p><span className="font-medium">Tenant:</span> {selectedTicket.tenant?.name}</p>
                <p><span className="font-medium">Priority:</span> {selectedTicket.priority}</p>
                <p><span className="font-medium">Status:</span> {selectedTicket.status}</p>
                <p><span className="font-medium">Created:</span> {new Date(selectedTicket.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <div className="border-t pt-4 mb-4">
                <p className="font-medium mb-2">Description:</p>
                <p className="text-gray-600 whitespace-pre-line">{selectedTicket.description}</p>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 mb-4">
                {selectedTicket.status === 'open' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Start Progress
                  </button>
                )}
                {selectedTicket.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Close Ticket
                  </button>
                )}
              </div>

              {/* Reply */}
              <div className="border-t pt-4">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send Reply
                </button>
              </div>
            </div>
            <div className="border-t px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}