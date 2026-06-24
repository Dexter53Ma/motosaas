-- Email Notifications tables for Issue #35
-- Run after 024_advanced_reporting.sql

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Email log table
CREATE TABLE IF NOT EXISTS public.email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select" ON public.email_templates FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = email_templates.tenant_id));
CREATE POLICY "email_templates_insert" ON public.email_templates FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = email_templates.tenant_id));
CREATE POLICY "email_templates_update" ON public.email_templates FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = email_templates.tenant_id));
CREATE POLICY "email_templates_delete" ON public.email_templates FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = email_templates.tenant_id));
CREATE POLICY "email_log_select" ON public.email_log FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = email_log.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON public.email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_log_tenant ON public.email_log(tenant_id);