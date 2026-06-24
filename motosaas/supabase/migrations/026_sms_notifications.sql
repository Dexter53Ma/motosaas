-- SMS Notifications tables for Issue #36
-- Run after 025_email_notifications.sql

-- SMS templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS log table
CREATE TABLE IF NOT EXISTS public.sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES sms_templates(id),
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_templates_select" ON public.sms_templates FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = sms_templates.tenant_id));
CREATE POLICY "sms_templates_insert" ON public.sms_templates FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = sms_templates.tenant_id));
CREATE POLICY "sms_templates_update" ON public.sms_templates FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = sms_templates.tenant_id));
CREATE POLICY "sms_templates_delete" ON public.sms_templates FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = sms_templates.tenant_id));
CREATE POLICY "sms_log_select" ON public.sms_log FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = sms_log.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_templates_tenant ON public.sms_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sms_log_tenant ON public.sms_log(tenant_id);