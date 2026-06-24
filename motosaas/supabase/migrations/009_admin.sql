-- Admin Dashboard tables for Issue #10
-- Run after 008_reporting.sql

-- Admin roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'support')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES admin_roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket messages
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'tenant')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_roles_select" ON public.admin_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin_roles_insert" ON public.admin_roles FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_roles WHERE role = 'super_admin'));

-- RLS policies for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_select" ON public.support_tickets FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admin_roles) OR
  auth.uid() IN (SELECT id FROM users WHERE tenant_id = support_tickets.tenant_id)
);
CREATE POLICY "support_tickets_insert" ON public.support_tickets FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE tenant_id = support_tickets.tenant_id)
);
CREATE POLICY "support_tickets_update" ON public.support_tickets FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM admin_roles) OR
  auth.uid() IN (SELECT id FROM users WHERE tenant_id = support_tickets.tenant_id AND role = 'owner')
);

-- RLS policies for ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_messages_select" ON public.ticket_messages FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admin_roles) OR
  auth.uid() = sender_id
);
CREATE POLICY "ticket_messages_insert" ON public.ticket_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- RLS policies for system_logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_logs_select" ON public.system_logs FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM admin_roles WHERE role IN ('super_admin', 'admin'))
);
CREATE POLICY "system_logs_insert" ON public.system_logs FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM admin_roles)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs(created_at);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles WHERE user_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_tenants BIGINT,
  active_tenants BIGINT,
  trial_tenants BIGINT,
  total_users BIGINT,
  total_vehicles BIGINT,
  total_rentals BIGINT,
  total_revenue DECIMAL,
  open_tickets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM tenants) as total_tenants,
    (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'active') as active_tenants,
    (SELECT COUNT(*) FROM tenants WHERE subscription_status = 'trial') as trial_tenants,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM vehicles) as total_vehicles,
    (SELECT COUNT(*) FROM rentals) as total_rentals,
    (SELECT COALESCE(SUM(amount), 0) FROM payments) as total_revenue,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;