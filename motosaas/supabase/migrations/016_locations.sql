-- Multi-Location Support tables for Issue #21
-- Run after 015_documents.sql

-- Locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add location_id to vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Add location_id to rentals
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES locations(id);
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS return_location_id UUID REFERENCES locations(id);

-- Add location_id to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- RLS policies for locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select" ON public.locations FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = locations.tenant_id));
CREATE POLICY "locations_insert" ON public.locations FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = locations.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "locations_update" ON public.locations FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = locations.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "locations_delete" ON public.locations FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = locations.tenant_id AND role = 'owner'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON public.locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX IF NOT EXISTS idx_rentals_pickup_location ON public.rentals(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_rentals_return_location ON public.rentals(return_location_id);
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(location_id);