-- API Keys & Webhooks tables for Issue #22
-- Run after 016_locations.sql

-- API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '["read"]',
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API usage logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = api_keys.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "api_keys_insert" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = api_keys.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "api_keys_update" ON public.api_keys FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = api_keys.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "api_keys_delete" ON public.api_keys FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = api_keys.tenant_id AND role IN ('owner', 'manager')));

-- RLS policies for webhooks
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_select" ON public.webhooks FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = webhooks.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "webhooks_insert" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = webhooks.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "webhooks_update" ON public.webhooks FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = webhooks.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "webhooks_delete" ON public.webhooks FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = webhooks.tenant_id AND role IN ('owner', 'manager')));

-- RLS policies for webhook_deliveries
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM webhooks WHERE id = webhook_deliveries.webhook_id)));

-- RLS policies for api_usage_logs
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_logs_select" ON public.api_usage_logs FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM api_keys WHERE id = api_usage_logs.api_key_id)));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON public.api_usage_logs(api_key_id);

-- Function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN 'mk_' || result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;