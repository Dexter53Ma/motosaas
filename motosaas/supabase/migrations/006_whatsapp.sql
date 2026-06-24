-- WhatsApp Integration tables for Issue #7
-- Run after 005_payments_invoices.sql

-- Message templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('rental_confirmation', 'payment_reminder', 'return_reminder', 'invoice', 'promotion', 'custom')),
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'ar', 'en')),
  subject TEXT,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Message logs
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id),
  template_id UUID REFERENCES whatsapp_templates(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'document', 'template')),
  direction TEXT NOT NULL DEFAULT 'outgoing' CHECK (direction IN ('incoming', 'outgoing')),
  content TEXT,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  external_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp configuration per tenant
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  phone_number TEXT,
  business_name TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  last_connected_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for whatsapp_templates
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_templates_select" ON public.whatsapp_templates FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_templates.tenant_id));
CREATE POLICY "whatsapp_templates_insert" ON public.whatsapp_templates FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_templates.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "whatsapp_templates_update" ON public.whatsapp_templates FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_templates.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "whatsapp_templates_delete" ON public.whatsapp_templates FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_templates.tenant_id AND role = 'owner'));

-- RLS policies for whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select" ON public.whatsapp_messages FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_messages.tenant_id));
CREATE POLICY "whatsapp_messages_insert" ON public.whatsapp_messages FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_messages.tenant_id));
CREATE POLICY "whatsapp_messages_update" ON public.whatsapp_messages FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_messages.tenant_id));

-- RLS policies for whatsapp_config
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_config_select" ON public.whatsapp_config FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_config.tenant_id));
CREATE POLICY "whatsapp_config_insert" ON public.whatsapp_config FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_config.tenant_id AND role = 'owner'));
CREATE POLICY "whatsapp_config_update" ON public.whatsapp_config FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = whatsapp_config.tenant_id AND role = 'owner'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant ON public.whatsapp_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_category ON public.whatsapp_templates(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant ON public.whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer ON public.whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_rental ON public.whatsapp_messages(rental_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_tenant ON public.whatsapp_config(tenant_id);

-- Default templates will be created when tenants set up their WhatsApp
-- No placeholder inserts needed