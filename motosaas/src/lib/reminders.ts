import { createClient } from '@/lib/supabase/client'
import { sendMessage, renderTemplate, getTemplates } from '@/lib/whatsapp'

const supabase = createClient()

export interface ReminderSettings {
  id: string
  tenant_id: string
  enabled: boolean
  days_before_due: number[]
  days_after_due: number[]
  send_time: string
  max_reminders: number
  auto_send: boolean
  created_at: string
  updated_at: string
}

export interface ReminderQueue {
  id: string
  tenant_id: string
  rental_id: string
  customer_id: string
  reminder_type: 'before_due' | 'after_due' | 'overdue'
  scheduled_for: string
  sent_at?: string
  status: 'pending' | 'sent' | 'cancelled' | 'failed'
  message?: string
  whatsapp_message_id?: string
  created_at: string
}

export interface ReminderHistory {
  id: string
  tenant_id: string
  rental_id: string
  customer_id: string
  reminder_type: string
  sent_at: string
  channel: 'whatsapp' | 'sms' | 'email'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  message?: string
  error_message?: string
  created_at: string
}

export async function getReminderSettings(tenantId: string): Promise<ReminderSettings | null> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateReminderSettings(tenantId: string, settings: Partial<ReminderSettings>) {
  const { data, error } = await supabase
    .from('reminder_settings')
    .upsert({ tenant_id: tenantId, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function scheduleReminders(rentalId: string, tenantId: string, customerId: string, endDate: string) {
  const settings = await getReminderSettings(tenantId)
  if (!settings || !settings.enabled) return

  // Cancel existing pending reminders for this rental
  await supabase
    .from('reminder_queue')
    .update({ status: 'cancelled' })
    .eq('rental_id', rentalId)
    .eq('status', 'pending')

  const endDateObj = new Date(endDate)

  // Schedule reminders before due date
  for (const days of settings.days_before_due) {
    const scheduledFor = new Date(endDateObj.getTime() - days * 24 * 60 * 60 * 1000)
    if (scheduledFor > new Date()) {
      await supabase.from('reminder_queue').insert({
        tenant_id: tenantId,
        rental_id: rentalId,
        customer_id: customerId,
        reminder_type: 'before_due',
        scheduled_for: scheduledFor.toISOString(),
        message: `Votre location prend fin dans ${days} jour(s). Merci de préparer le retour.`,
      })
    }
  }

  // Schedule reminders after due date
  for (const days of settings.days_after_due) {
    const scheduledFor = new Date(endDateObj.getTime() + days * 24 * 60 * 60 * 1000)
    await supabase.from('reminder_queue').insert({
      tenant_id: tenantId,
      rental_id: rentalId,
      customer_id: customerId,
      reminder_type: 'after_due',
      scheduled_for: scheduledFor.toISOString(),
      message: `Votre location est en retard de ${days} jour(s). Merci de retourner le véhicule.`,
    })
  }
}

export async function getPendingReminders(tenantId: string): Promise<ReminderQueue[]> {
  const { data, error } = await supabase
    .from('reminder_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })

  if (error) throw error
  return data || []
}

export async function processPendingReminders(tenantId: string) {
  const pendingReminders = await getPendingReminders(tenantId)
  const results = []

  for (const reminder of pendingReminders) {
    try {
      // Get customer info
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', reminder.customer_id)
        .single()

      if (!customer?.phone) {
        await supabase
          .from('reminder_queue')
          .update({ status: 'failed' })
          .eq('id', reminder.id)
        continue
      }

      // Get rental info
      const { data: rental } = await supabase
        .from('rentals')
        .select('*, vehicle:vehicles(*)')
        .eq('id', reminder.rental_id)
        .single()

      // Send WhatsApp message
      const result = await sendMessage({
        tenant_id: tenantId,
        customer_id: reminder.customer_id,
        rental_id: reminder.rental_id,
        content: reminder.message || '',
      })

      // Update reminder status
      await supabase
        .from('reminder_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          whatsapp_message_id: result.id,
        })
        .eq('id', reminder.id)

      // Add to history
      await supabase.from('reminder_history').insert({
        tenant_id: tenantId,
        rental_id: reminder.rental_id,
        customer_id: reminder.customer_id,
        reminder_type: reminder.reminder_type,
        channel: 'whatsapp',
        status: 'sent',
        message: reminder.message,
      })

      results.push({ id: reminder.id, status: 'sent' })
    } catch (err: any) {
      console.error(`Failed to send reminder ${reminder.id}:`, err)
      await supabase
        .from('reminder_queue')
        .update({ status: 'failed' })
        .eq('id', reminder.id)
      results.push({ id: reminder.id, status: 'failed', error: err.message })
    }
  }

  return results
}

export async function getOverdueRentals(tenantId: string) {
  const { data, error } = await supabase
    .rpc('get_overdue_rentals', { p_tenant_id: tenantId })

  if (error) throw error
  return data || []
}

export async function sendBulkReminders(tenantId: string, rentalIds: string[]) {
  const results = []

  for (const rentalId of rentalIds) {
    try {
      const { data: rental } = await supabase
        .from('rentals')
        .select('*, customer:customers(*)')
        .eq('id', rentalId)
        .single()

      if (!rental?.customer?.phone) {
        results.push({ rentalId, status: 'failed', error: 'No phone number' })
        continue
      }

      const balance = rental.total_amount - (rental.paid_amount || 0)
      const message = `Rappel: Solde impayé de ${balance} MAD pour votre location. Merci de procéder au paiement.`

      await sendMessage({
        tenant_id: tenantId,
        customer_id: rental.customer_id,
        rental_id: rentalId,
        content: message,
      })

      // Add to history
      await supabase.from('reminder_history').insert({
        tenant_id: tenantId,
        rental_id: rentalId,
        customer_id: rental.customer_id,
        reminder_type: 'overdue',
        channel: 'whatsapp',
        status: 'sent',
        message,
      })

      results.push({ rentalId, status: 'sent' })
    } catch (err: any) {
      results.push({ rentalId, status: 'failed', error: err.message })
    }
  }

  return results
}

export async function getReminderHistory(tenantId: string, limit = 50): Promise<ReminderHistory[]> {
  const { data, error } = await supabase
    .from('reminder_history')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sent_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

export async function getReminderStats(tenantId: string) {
  const { data, error } = await supabase
    .from('reminder_history')
    .select('status, reminder_type')
    .eq('tenant_id', tenantId)

  if (error) throw error

  const stats = {
    total: data.length,
    sent: data.filter(r => r.status === 'sent').length,
    delivered: data.filter(r => r.status === 'delivered').length,
    read: data.filter(r => r.status === 'read').length,
    failed: data.filter(r => r.status === 'failed').length,
    beforeDue: data.filter(r => r.reminder_type === 'before_due').length,
    afterDue: data.filter(r => r.reminder_type === 'after_due').length,
    overdue: data.filter(r => r.reminder_type === 'overdue').length,
  }

  return stats
}