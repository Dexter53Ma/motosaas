-- Create rentals table
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  actual_return_date TIMESTAMPTZ,
  daily_rate DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0,
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  fuel_level_out INTEGER CHECK (fuel_level_out BETWEEN 0 AND 100),
  fuel_level_in INTEGER CHECK (fuel_level_in BETWEEN 0 AND 100),
  mileage_out INTEGER,
  mileage_in INTEGER,
  checkout_checklist_json JSONB,
  return_checklist_json JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  loan_id UUID,
  amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money')),
  reference TEXT,
  notes TEXT,
  is_refund BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create deposits table
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'refunded', 'partial')),
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  refund_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rentals_tenant_id ON rentals(tenant_id);
CREATE INDEX idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_start_date ON rentals(start_date);
CREATE INDEX idx_rentals_end_date ON rentals(end_date);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_rental_id ON payments(rental_id);
CREATE INDEX idx_deposits_tenant_id ON deposits(tenant_id);

-- Enable Row Level Security
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rentals
CREATE POLICY "Users can view rentals in their tenant" ON rentals
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert rentals in their tenant" ON rentals
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update rentals in their tenant" ON rentals
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for payments
CREATE POLICY "Users can view payments in their tenant" ON payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert payments in their tenant" ON payments
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for deposits
CREATE POLICY "Users can view deposits in their tenant" ON deposits
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert deposits in their tenant" ON deposits
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Staff can update deposits in their tenant" ON deposits
  FOR UPDATE USING (
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

-- Create trigger for rentals
CREATE TRIGGER update_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate late fees
CREATE OR REPLACE FUNCTION calculate_late_fee(
  p_end_date TIMESTAMPTZ,
  p_actual_return_date TIMESTAMPTZ,
  p_daily_rate DECIMAL,
  p_late_fee_per_day DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_days_late INTEGER;
  v_late_fee DECIMAL;
  v_fee_per_day DECIMAL;
BEGIN
  IF p_actual_return_date IS NULL OR p_actual_return_date <= p_end_date THEN
    RETURN 0;
  END IF;
  
  v_days_late := EXTRACT(DAY FROM (p_actual_return_date - p_end_date));
  v_fee_per_day := COALESCE(p_late_fee_per_day, p_daily_rate * 1.5);
  v_late_fee := v_days_late * v_fee_per_day;
  
  RETURN v_late_fee;
END;
$$ LANGUAGE plpgsql;
