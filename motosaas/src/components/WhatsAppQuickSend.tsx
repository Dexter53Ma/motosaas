'use client'

import { useState } from 'react'
import { sendRentalConfirmation, sendPaymentReminder, sendReturnReminder, openWhatsAppChat } from '@/lib/whatsapp'

interface WhatsAppQuickSendProps {
  customerPhone?: string
  rentalId?: string
  onMessageSent?: () => void
}

export default function WhatsAppQuickSend({ customerPhone, rentalId, onMessageSent }: WhatsAppQuickSendProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOptions, setShowOptions] = useState(false)

  async function handleQuickSend(type: 'confirmation' | 'payment' | 'return' | 'custom') {
    if (!rentalId && type !== 'custom') {
      alert('No rental linked')
      return
    }

    setLoading(true)
    setError('')

    try {
      switch (type) {
        case 'confirmation':
          await sendRentalConfirmation(rentalId!)
          break
        case 'payment':
          await sendPaymentReminder(rentalId!)
          break
        case 'return':
          await sendReturnReminder(rentalId!)
          break
        case 'custom':
          openWhatsAppChat(customerPhone || '')
          return
      }
      onMessageSent?.()
      setShowOptions(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'WhatsApp'}
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 w-48">
          <button
            onClick={() => handleQuickSend('confirmation')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Send Confirmation
          </button>
          <button
            onClick={() => handleQuickSend('payment')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Payment Reminder
          </button>
          <button
            onClick={() => handleQuickSend('return')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Return Reminder
          </button>
          <hr />
          <button
            onClick={() => handleQuickSend('custom')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
          >
            Open WhatsApp Chat
          </button>
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-1 bg-red-50 text-red-700 p-2 rounded text-sm w-48">
          {error}
        </div>
      )}
    </div>
  )
}