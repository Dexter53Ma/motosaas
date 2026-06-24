-- Role-Based Permissions tables for Issue #38
-- Run after 027_two_factor_auth.sql

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- RLS policies
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT USING (true);

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
('vehicles.view', 'View vehicles', 'Vehicles'),
('vehicles.create', 'Create vehicles', 'Vehicles'),
('vehicles.edit', 'Edit vehicles', 'Vehicles'),
('vehicles.delete', 'Delete vehicles', 'Vehicles'),
('customers.view', 'View customers', 'Customers'),
('customers.create', 'Create customers', 'Customers'),
('customers.edit', 'Edit customers', 'Customers'),
('customers.delete', 'Delete customers', 'Customers'),
('rentals.view', 'View rentals', 'Rentals'),
('rentals.create', 'Create rentals', 'Rentals'),
('rentals.edit', 'Edit rentals', 'Rentals'),
('rentals.delete', 'Delete rentals', 'Rentals'),
('payments.view', 'View payments', 'Payments'),
('payments.create', 'Create payments', 'Payments'),
('payments.refund', 'Refund payments', 'Payments'),
('reports.view', 'View reports', 'Reports'),
('reports.export', 'Export reports', 'Reports'),
('settings.view', 'View settings', 'Settings'),
('settings.edit', 'Edit settings', 'Settings'),
('users.view', 'View users', 'Users'),
('users.invite', 'Invite users', 'Users'),
('users.manage', 'Manage users', 'Users');

-- Insert default role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'owner', id FROM permissions;

INSERT INTO role_permissions (role, permission_id)
SELECT 'manager', id FROM permissions WHERE name NOT IN ('settings.edit', 'users.manage');

INSERT INTO role_permissions (role, permission_id)
SELECT 'staff', id FROM permissions WHERE name LIKE '%.view' OR name IN ('rentals.create', 'payments.create', 'customers.create');