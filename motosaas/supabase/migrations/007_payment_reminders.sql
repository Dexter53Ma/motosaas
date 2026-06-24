-- Payment Reminders tables for Issue #8
-- Run after 006_whatsapp.sql

-- Reminder settings per tenant
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  days_before_due INTEGER[] DEFAULT '{3, 1}',
  days_after_due INTEGER[] DEFAULT '{1, 3, 7, 14}',
  send_time TIME DEFAULT '09:00:00',
  max_reminders INTEGER NOT NULL DEFAULT 5,
  auto_send BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminder queue (for scheduled reminders)
CREATE TABLE IF NOT EXISTS public.reminder_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('before_due', 'after_due', 'overdue')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  message TEXT,
  whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminder history (sent reminders)
CREATE TABLE IF NOT EXISTS public.reminder_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  message TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for reminder_settings
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_settings_select" ON public.reminder_settings FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_settings.tenant_id));
CREATE POLICY "reminder_settings_insert" ON public.reminder_settings FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_settings.tenant_id AND role = 'owner'));
CREATE POLICY "reminder_settings_update" ON public.reminder_settings FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_settings.tenant_id AND role = 'owner'));

-- RLS policies for reminder_queue
ALTER TABLE public.reminder_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_queue_select" ON public.reminder_queue FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_queue.tenant_id));
CREATE POLICY "reminder_queue_insert" ON public.reminder_queue FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_queue.tenant_id));
CREATE POLICY "reminder_queue_update" ON public.reminder_queue FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_queue.tenant_id));

-- RLS policies for reminder_history
ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminder_history_select" ON public.reminder_history FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_history.tenant_id));
CREATE POLICY "reminder_history_insert" ON public.reminder_history FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = reminder_history.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_settings_tenant ON public.reminder_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_tenant ON public.reminder_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_scheduled ON public.reminder_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_status ON public.reminder_queue(status);
CREATE INDEX IF NOT EXISTS idx_reminder_queue_rental ON public.reminder_queue(rental_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_tenant ON public.reminder_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_customer ON public.reminder_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminder_history_rental ON public.reminder_history(rental_id);

-- Function to schedule reminders for a rental
CREATE OR REPLACE FUNCTION schedule_rental_reminders(
  p_rental_id UUID,
  p_tenant_id UUID,
  p_customer_id UUID,
  p_end_date TIMESTAMPTZ
) RETURNS VOID AS $$
DECLARE
  v_settings RECORD;
  v_days INTEGER;
BEGIN
  -- Get reminder settings
  SELECT * INTO v_settings FROM reminder_settings WHERE tenant_id = p_tenant_id;
  
  IF NOT FOUND OR NOT v_settings.enabled THEN
    RETURN;
  END IF;

  -- Schedule reminders before due date
  FOREACH v_days IN ARRAY v_settings.days_before_due LOOP
    INSERT INTO reminder_queue (tenant_id, rental_id, customer_id, reminder_type, scheduled_for, message)
    VALUES (
      p_tenant_id,
      p_rental_id,
      p_customer_id,
      'before_due',
      p_end_date - (v_days || ' days')::INTERVAL,
      'Votre location prend fin dans ' || v_days || ' jour(s). Merci de préparer le retour.'
    );
  END LOOP;

  -- Schedule reminders after due date
  FOREACH v_days IN ARRAY v_settings.days_after_due LOOP
    INSERT INTO reminder_queue (tenant_id, rental_id, customer_id, reminder_type, scheduled_for, message)
    VALUES (
      p_tenant_id,
      p_rental_id,
      p_customer_id,
      'after_due',
      p_end_date + (v_days || ' days')::INTERVAL,
      'Votre location est en retard de ' || v_days || ' jour(s). Merci de retourner le véhicule.'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue rentals
CREATE OR REPLACE FUNCTION get_overdue_rentals(p_tenant_id UUID)
RETURNS TABLE (
  rental_id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  vehicle_info TEXT,
  days_overdue BIGINT,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as rental_id,
    r.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.phone as customer_phone,
    v.make || ' ' || v.model as vehicle_info,
    EXTRACT(DAY FROM now() - r.end_date)::BIGINT as days_overdue,
    r.total_amount - COALESCE(r.paid_amount, 0) as balance
  FROM rentals r
  JOIN customers c ON r.customer_id = c.id
  JOIN vehicles v ON r.vehicle_id = v.id
  WHERE r.tenant_id = p_tenant_id
    AND r.status IN ('active', 'overdue')
    AND r.end_date < now()
  ORDER BY r.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;