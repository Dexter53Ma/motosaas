-- Create vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  license_plate TEXT NOT NULL,
  color TEXT,
  mileage INTEGER DEFAULT 0,
  purchase_price DECIMAL(12, 2),
  daily_rate DECIMAL(10, 2) NOT NULL DEFAULT 100,
  weekly_rate DECIMAL(10, 2),
  monthly_rate DECIMAL(10, 2),
  fuel_type TEXT DEFAULT 'gasoline' CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vehicle photos table
CREATE TABLE vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'exterior' CHECK (category IN ('exterior', 'interior', 'damage', 'document')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vehicle maintenance table
CREATE TABLE vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) DEFAULT 0,
  odometer_reading INTEGER,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_due_km INTEGER,
  next_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);

-- Enable Row Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicles
CREATE POLICY "Users can view vehicles in their tenant" ON vehicles
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert vehicles in their tenant" ON vehicles
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update vehicles in their tenant" ON vehicles
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete vehicles in their tenant" ON vehicles
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Create RLS policies for vehicle_photos
CREATE POLICY "Users can view vehicle_photos in their tenant" ON vehicle_photos
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert vehicle_photos in their tenant" ON vehicle_photos
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete vehicle_photos in their tenant" ON vehicle_photos
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for vehicle_maintenance
CREATE POLICY "Users can view vehicle_maintenance in their tenant" ON vehicle_maintenance
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert vehicle_maintenance in their tenant" ON vehicle_maintenance
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicles
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
