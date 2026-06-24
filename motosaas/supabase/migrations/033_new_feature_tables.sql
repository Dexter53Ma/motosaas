-- Migration 033: New feature tables for POS, Loans, Deposits, Insurance, Fuel, Pricing, Loyalty, Refunds, Group Bookings

-- =============================================
-- GROUP BOOKINGS (Issue #26)
-- =============================================
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_booking_id UUID NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  daily_rate NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_bookings_tenant ON group_bookings(tenant_id);
CREATE INDEX idx_group_booking_items_booking ON group_booking_items(group_booking_id);

ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage group bookings in their tenant" ON group_bookings
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage group booking items in their tenant" ON group_booking_items
  FOR ALL USING (group_booking_id IN (
    SELECT id FROM group_bookings WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  ));

-- =============================================
-- LOANS (Issue #14)
-- =============================================
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  lender_name TEXT NOT NULL,
  loan_amount NUMERIC(12,2) NOT NULL,
  monthly_payment NUMERIC(10,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remaining_balance NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_tenant ON loans(tenant_id);
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage loans in their tenant" ON loans
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- DEPOSITS (Issue #22)
-- =============================================
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  deduction_reason TEXT,
  refund_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'partially_refunded', 'fully_refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deposits_tenant ON deposits(tenant_id);
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage deposits in their tenant" ON deposits
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- INSURANCE (Issue #21)
-- =============================================
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  insurance_company TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  policy_type TEXT NOT NULL DEFAULT 'comprehensive' CHECK (policy_type IN ('comprehensive', 'third_party', 'third_party_fire', 'collision')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  premium_amount NUMERIC(10,2) NOT NULL,
  coverage_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_insurance_tenant ON insurance_policies(tenant_id);
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage insurance in their tenant" ON insurance_policies
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- FUEL TRACKING (Issue #25)
-- =============================================
CREATE TABLE IF NOT EXISTS fuel_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  fuel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters NUMERIC(8,2) NOT NULL,
  cost_per_liter NUMERIC(8,2) NOT NULL,
  total_cost NUMERIC(10,2) GENERATED ALWAYS AS (liters * cost_per_liter) STORED,
  odometer_reading INTEGER,
  fuel_type TEXT NOT NULL DEFAULT 'diesel' CHECK (fuel_type IN ('diesel', 'gasoline', 'electric', 'hybrid')),
  station_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_tenant ON fuel_entries(tenant_id);
ALTER TABLE fuel_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage fuel entries in their tenant" ON fuel_entries
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- DYNAMIC PRICING (Issue #23)
-- =============================================
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'all',
  base_rate NUMERIC(10,2) NOT NULL,
  peak_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  weekend_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  holiday_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  min_rental_days INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL,
  effective_until DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_tenant ON pricing_rules(tenant_id);
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage pricing rules in their tenant" ON pricing_rules
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- LOYALTY PROGRAM (Issue #24)
-- =============================================
CREATE TABLE IF NOT EXISTS loyalty_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  points_redeemed INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  loyalty_tier TEXT NOT NULL DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, customer_id)
);

CREATE INDEX idx_loyalty_tenant ON loyalty_customers(tenant_id);
ALTER TABLE loyalty_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage loyalty in their tenant" ON loyalty_customers
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- REFUNDS (Issue #27)
-- =============================================
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refunds_tenant ON refunds(tenant_id);
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage refunds in their tenant" ON refunds
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =============================================
-- POS (Issue #15)
-- =============================================
CREATE TABLE IF NOT EXISTS pos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'accessories',
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
  subtotal NUMERIC(10,2) NOT NULL,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES pos_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pos_items_tenant ON pos_items(tenant_id);
CREATE INDEX idx_pos_transactions_tenant ON pos_transactions(tenant_id);

ALTER TABLE pos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage POS items in their tenant" ON pos_items
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage POS transactions in their tenant" ON pos_transactions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage POS transaction items in their tenant" ON pos_transaction_items
  FOR ALL USING (transaction_id IN (
    SELECT id FROM pos_transactions WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  ));
