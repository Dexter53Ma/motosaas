-- Customer Portal tables for Issue #27
-- Run after 018_audit_logging.sql

-- Customer portal access table
CREATE TABLE IF NOT EXISTS public.customer_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, tenant_id)
);

-- Customer portal invitations table
CREATE TABLE IF NOT EXISTS public.customer_portal_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for customer_portal_access
ALTER TABLE public.customer_portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_portal_access_select" ON public.customer_portal_access FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_portal_access.tenant_id));
CREATE POLICY "customer_portal_access_insert" ON public.customer_portal_access FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_portal_access.tenant_id));
CREATE POLICY "customer_portal_access_update" ON public.customer_portal_access FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_portal_access.tenant_id));

-- RLS policies for customer_portal_invitations
ALTER TABLE public.customer_portal_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_portal_invitations_select" ON public.customer_portal_invitations FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_portal_invitations.tenant_id));
CREATE POLICY "customer_portal_invitations_insert" ON public.customer_portal_invitations FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_portal_invitations.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_tenant ON public.customer_portal_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_email ON public.customer_portal_access(email);
CREATE INDEX IF NOT EXISTS idx_customer_portal_invitations_token ON public.customer_portal_invitations(token);
CREATE INDEX IF NOT EXISTS idx_customer_portal_invitations_tenant ON public.customer_portal_invitations(tenant_id);