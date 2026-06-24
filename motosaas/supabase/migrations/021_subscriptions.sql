-- Subscription Management tables for Issue #31
-- Run after 020_feedback.sql

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(12,2) NOT NULL,
  price_yearly DECIMAL(12,2) NOT NULL,
  features JSONB DEFAULT '[]',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoices for subscriptions table
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select" ON public.plans FOR SELECT USING (true);
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = subscriptions.tenant_id));
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = subscriptions.tenant_id AND role = 'owner'));
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = subscriptions.tenant_id AND role = 'owner'));
CREATE POLICY "subscription_invoices_select" ON public.subscription_invoices FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM subscriptions WHERE id = subscription_invoices.subscription_id)));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription ON public.subscription_invoices(subscription_id);

-- Insert default plans
INSERT INTO plans (name, description, price_monthly, price_yearly, features, limits) VALUES
('Free', 'Basic features for small shops', 0, 0, '["core_ops", "1_user", "5_vehicles", "whatsapp"]', '{"users": 1, "vehicles": 5, "customers": 50}'),
('Pro', 'All features for growing businesses', 100, 500, '["all_features", "unlimited", "priority_support"]', '{"users": -1, "vehicles": -1, "customers": -1}');