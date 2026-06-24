-- Payment Gateway tables for Issue #32
-- Run after 021_subscriptions.sql

-- Payment gateway configuration table
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'square', 'other')),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gateway transactions table
CREATE TABLE IF NOT EXISTS public.gateway_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gateway_id UUID NOT NULL REFERENCES payment_gateways(id),
  payment_id UUID REFERENCES payments(id),
  external_id TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MAD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_gateways_select" ON public.payment_gateways FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = payment_gateways.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "payment_gateways_insert" ON public.payment_gateways FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = payment_gateways.tenant_id AND role = 'owner'));
CREATE POLICY "payment_gateways_update" ON public.payment_gateways FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = payment_gateways.tenant_id AND role = 'owner'));
CREATE POLICY "payment_gateways_delete" ON public.payment_gateways FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = payment_gateways.tenant_id AND role = 'owner'));
CREATE POLICY "gateway_transactions_select" ON public.gateway_transactions FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = gateway_transactions.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_gateways_tenant ON public.payment_gateways(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_tenant ON public.gateway_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gateway_transactions_payment ON public.gateway_transactions(payment_id);