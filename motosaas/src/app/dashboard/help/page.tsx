'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Video, MessageCircle, ChevronDown, CheckCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const FAQ_ITEMS = [
  {
    question: 'How do I add a new vehicle?',
    answer: 'Go to Vehicles â†’ Add Vehicle. Fill in the make, model, year, license plate, and daily rate. You can also add photos and maintenance history.',
  },
  {
    question: 'How do I create a rental?',
    answer: 'Go to Rentals â†’ New Rental. Select a customer and vehicle, set the rental dates, and the system will automatically calculate the total amount.',
  },
  {
    question: 'How do I record a payment?',
    answer: 'Go to Payments â†’ Record Payment. Select the customer and rental, enter the amount and payment method (cash, card, bank transfer, or mobile money).',
  },
  {
    question: 'How do I send a WhatsApp reminder?',
    answer: 'Go to Reminders, select the overdue rentals, and click Send Reminders. The system will send WhatsApp messages using your configured templates.',
  },
  {
    question: 'Can I track vehicle damage?',
    answer: 'Yes! Go to any vehicle â†’ Damage History. You can report damage with photos, track repair status, and monitor damage costs.',
  },
  {
    question: 'How do I generate an invoice?',
    answer: 'Go to any rental â†’ Generate Invoice. The system will create a professional invoice with TVA (20%) that you can download or send via WhatsApp.',
  },
  {
    question: 'Is there a mobile app?',
    answer: 'MotoRent is a responsive web app that works great on mobile devices. Add it to your home screen for an app-like experience.',
  },
  {
    question: 'How do I invite team members?',
    answer: 'Go to Settings â†’ Team. Click Invite Member and enter their email address. They\'ll receive an invitation to join your shop.',
  },
]

export default function HelpPage() {
  const { t } = useI18n()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleContact(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        toast.error('You must be logged in to submit a ticket')
        setSending(false)
        return
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        toast.error('Could not find your account')
        setSending(false)
        return
      }

      const { error: insertError } = await supabase.from('support_tickets').insert({
        tenant_id: userData.tenant_id,
        user_id: user.id,
        subject: contactForm.subject,
        description: `From: ${contactForm.name} (${contactForm.email})\n\n${contactForm.message}`,
        status: 'open',
        priority: 'medium',
      })

      if (insertError) throw insertError

      setSent(true)
      toast.success('Message sent successfully!')
      setContactForm({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <PageTransition>
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, title: 'Documentation', desc: 'Learn how to use all features' },
            { icon: Video, title: 'Video Tutorials', desc: 'Watch step-by-step guides' },
            { icon: MessageCircle, title: 'Live Chat', desc: 'Chat with our support team' },
          ].map((item, i) => (
            <Card key={i} className="text-center">
              <CardContent>
                <item.icon className="h-8 w-8 mx-auto mb-2 text-emerald-600" />
                <h3 className="font-medium mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("help.faq")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {FAQ_ITEMS.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <span className="font-medium">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-4 text-gray-600">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t("help.contact_support")}</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-600" />
                <h3 className="font-medium text-lg mb-2">{t("help.message_sent")}</h3>
                <p className="text-gray-600">{t("help.get_back")}</p>
                <Button
                  variant="ghost"
                  onClick={() => setSent(false)}
                  className="mt-4 text-emerald-600 hover:text-emerald-700"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("help.subject")}</Label>
                  <Input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>{t("help.message")}</Label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  />
                </div>
                <Button type="submit" disabled={sending} className="bg-emerald-600 hover:bg-emerald-700">
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </PageTransition>
  )
}
