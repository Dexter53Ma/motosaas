'use client'

import { useState } from 'react'
import Link from 'next/link'

const FAQ_ITEMS = [
  {
    question: 'How do I add a new vehicle?',
    answer: 'Go to Vehicles → Add Vehicle. Fill in the make, model, year, license plate, and daily rate. You can also add photos and maintenance history.',
  },
  {
    question: 'How do I create a rental?',
    answer: 'Go to Rentals → New Rental. Select a customer and vehicle, set the rental dates, and the system will automatically calculate the total amount.',
  },
  {
    question: 'How do I record a payment?',
    answer: 'Go to Payments → Record Payment. Select the customer and rental, enter the amount and payment method (cash, card, bank transfer, or mobile money).',
  },
  {
    question: 'How do I send a WhatsApp reminder?',
    answer: 'Go to Reminders, select the overdue rentals, and click Send Reminders. The system will send WhatsApp messages using your configured templates.',
  },
  {
    question: 'Can I track vehicle damage?',
    answer: 'Yes! Go to any vehicle → Damage History. You can report damage with photos, track repair status, and monitor damage costs.',
  },
  {
    question: 'How do I generate an invoice?',
    answer: 'Go to any rental → Generate Invoice. The system will create a professional invoice with TVA (20%) that you can download or send via WhatsApp.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'MotoRent is a responsive web app that works great on mobile devices. Add it to your home screen for an app-like experience.',
  },
  {
    question: 'How do I invite team members?',
    answer: 'Go to Settings → Team. Click Invite Member and enter their email address. They\'ll receive an invitation to join your shop.',
  },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await new Promise(r => setTimeout(r, 1000))
    setSending(false)
    setSent(true)
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">MotoRent</Link>
              <h1 className="text-lg font-medium">Help & Support</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <span className="text-3xl mb-2 block">📚</span>
            <h3 className="font-medium mb-1">Documentation</h3>
            <p className="text-sm text-gray-500 mb-3">Learn how to use all features</p>
            <button className="text-blue-600 text-sm hover:underline">Coming Soon</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <span className="text-3xl mb-2 block">🎥</span>
            <h3 className="font-medium mb-1">Video Tutorials</h3>
            <p className="text-sm text-gray-500 mb-3">Watch step-by-step guides</p>
            <button className="text-blue-600 text-sm hover:underline">Coming Soon</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <span className="text-3xl mb-2 block">💬</span>
            <h3 className="font-medium mb-1">Live Chat</h3>
            <p className="text-sm text-gray-500 mb-3">Chat with our support team</p>
            <button className="text-blue-600 text-sm hover:underline">Coming Soon</button>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium">{item.question}</span>
                  <span className={`transform transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-gray-600">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Contact Support</h2>
          </div>
          <div className="p-4">
            {sent ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">✅</span>
                <h3 className="font-medium text-lg mb-2">Message Sent!</h3>
                <p className="text-gray-600">We'll get back to you within 24 hours.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 px-4 py-2 text-blue-600 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}