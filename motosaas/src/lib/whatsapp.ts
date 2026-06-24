import { createClient } from '@/lib/supabase/client'

export interface WhatsAppMessage {
  id: string
  tenant_id: string
  customer_id: string
  rental_id?: string
  template_id?: string
  message_type: 'text' | 'image' | 'document' | 'template'
  direction: 'incoming' | 'outgoing'
  content?: string
  media_url?: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  error_message?: string
  external_id?: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  created_at: string
}

export interface WhatsAppTemplate {
  id: string
  tenant_id: string
  name: string
  category: string
  language: string
  subject?: string
  body: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getWhatsAppConfig(tenantId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateWhatsAppConfig(tenantId: string, config: Partial<{ phone_number: string; business_name: string; is_connected: boolean }>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_config')
    .upsert({ tenant_id: tenantId, ...config, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTemplates(tenantId: string, category?: string) {
  const supabase = createClient()
  let query = supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data as WhatsAppTemplate[]
}

export async function createTemplate(template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .insert(template)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTemplate(id: string, updates: Partial<WhatsAppTemplate>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTemplate(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('whatsapp_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return rendered
}

export async function sendMessage(params: {
  tenant_id: string
  customer_id: string
  rental_id?: string
  template_id?: string
  content: string
  message_type?: 'text' | 'image' | 'document' | 'template'
  media_url?: string
}) {
  const supabase = createClient()
  const message = {
    tenant_id: params.tenant_id,
    customer_id: params.customer_id,
    rental_id: params.rental_id,
    template_id: params.template_id,
    message_type: params.message_type || 'text',
    direction: 'outgoing' as const,
    content: params.content,
    media_url: params.media_url,
    status: 'pending' as const,
  }

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error

  // In production, this would call the WhatsApp API
  // For MVP, we'll simulate sending via whatsapp-web.js
  // The actual API call would be handled by a server-side API route

  // Simulate sending (in real app, this would be an API call)
  await simulateSendWhatsApp(data.id)

  return data
}

async function simulateSendWhatsApp(messageId: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  const supabase = createClient()
  // Update status to sent
  const { error } = await supabase
    .from('whatsapp_messages')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      external_id: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })
    .eq('id', messageId)

  if (error) console.error('Error updating message status:', error)
}

export async function getMessageHistory(customerId: string, limit = 50) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as WhatsAppMessage[]
}

export async function getMessageStats(tenantId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('status')
    .eq('tenant_id', tenantId)

  if (error) throw error

  const stats = {
    total: data.length,
    sent: data.filter(m => m.status === 'sent').length,
    delivered: data.filter(m => m.status === 'delivered').length,
    read: data.filter(m => m.status === 'read').length,
    failed: data.filter(m => m.status === 'failed').length,
  }

  return stats
}

// Quick send functions for common scenarios
export async function sendRentalConfirmation(rentalId: string) {
  const supabase = createClient()
  const { data: rental, error } = await supabase
    .from('rentals')
    .select('*, customer:customers(*), vehicle:vehicles(*)')
    .eq('id', rentalId)
    .single()

  if (error) throw error
  if (!rental.customer?.phone) throw new Error('Customer phone number not found')

  const templates = await getTemplates(rental.tenant_id, 'rental_confirmation')
  const template = templates[0] // Use first available template

  if (!template) throw new Error('No rental confirmation template found')

  const content = renderTemplate(template.body, {
    customer_name: rental.customer.full_name,
    vehicle_make: rental.vehicle?.make || '',
    vehicle_model: rental.vehicle?.model || '',
    start_date: new Date(rental.start_date).toLocaleDateString('fr-FR'),
    end_date: new Date(rental.end_date).toLocaleDateString('fr-FR'),
    daily_rate: rental.daily_rate?.toString() || '',
  })

  return sendMessage({
    tenant_id: rental.tenant_id,
    customer_id: rental.customer_id,
    rental_id: rentalId,
    template_id: template.id,
    content,
  })
}

export async function sendPaymentReminder(rentalId: string) {
  const supabase = createClient()
  const { data: rental, error } = await supabase
    .from('rentals')
    .select('*, customer:customers(*), vehicle:vehicles(*)')
    .eq('id', rentalId)
    .single()

  if (error) throw error
  if (!rental.customer?.phone) throw new Error('Customer phone number not found')

  const templates = await getTemplates(rental.tenant_id, 'payment_reminder')
  const template = templates[0]

  if (!template) throw new Error('No payment reminder template found')

  const balance = rental.total_amount - (rental.paid_amount || 0)
  const content = renderTemplate(template.body, {
    customer_name: rental.customer.full_name,
    amount: balance.toString(),
  })

  return sendMessage({
    tenant_id: rental.tenant_id,
    customer_id: rental.customer_id,
    rental_id: rentalId,
    template_id: template.id,
    content,
  })
}

export async function sendReturnReminder(rentalId: string) {
  const supabase = createClient()
  const { data: rental, error } = await supabase
    .from('rentals')
    .select('*, customer:customers(*), vehicle:vehicles(*)')
    .eq('id', rentalId)
    .single()

  if (error) throw error
  if (!rental.customer?.phone) throw new Error('Customer phone number not found')

  const templates = await getTemplates(rental.tenant_id, 'return_reminder')
  const template = templates[0]

  if (!template) throw new Error('No return reminder template found')

  const content = renderTemplate(template.body, {
    customer_name: rental.customer.full_name,
    vehicle_make: rental.vehicle?.make || '',
    vehicle_model: rental.vehicle?.model || '',
    return_date: new Date(rental.end_date).toLocaleDateString('fr-FR'),
  })

  return sendMessage({
    tenant_id: rental.tenant_id,
    customer_id: rental.customer_id,
    rental_id: rentalId,
    template_id: template.id,
    content,
  })
}

export function openWhatsAppChat(phone: string, message?: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = message ? encodeURIComponent(message) : ''
  window.open(`https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`, '_blank')
}