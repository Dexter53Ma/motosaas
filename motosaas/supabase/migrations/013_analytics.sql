-- Analytics views and functions for Issue #17
-- Run after 012_checklists.sql

-- Daily revenue view
CREATE OR REPLACE VIEW daily_revenue_view AS
SELECT
  tenant_id,
  DATE(created_at) as date,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as avg_transaction
FROM payments
WHERE NOT is_refund
GROUP BY tenant_id, DATE(created_at);

-- Weekly revenue view
CREATE OR REPLACE VIEW weekly_revenue_view AS
SELECT
  tenant_id,
  DATE_TRUNC('week', created_at) as week_start,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as avg_transaction
FROM payments
WHERE NOT is_refund
GROUP BY tenant_id, DATE_TRUNC('week', created_at);

-- Monthly revenue view
CREATE OR REPLACE VIEW monthly_revenue_view AS
SELECT
  tenant_id,
  DATE_TRUNC('month', created_at) as month_start,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as avg_transaction
FROM payments
WHERE NOT is_refund
GROUP BY tenant_id, DATE_TRUNC('month', created_at);

-- Revenue by payment method view
CREATE OR REPLACE VIEW revenue_by_payment_method_view AS
SELECT
  tenant_id,
  payment_method,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count
FROM payments
WHERE NOT is_refund
GROUP BY tenant_id, payment_method;

-- Vehicle utilization view
CREATE OR REPLACE VIEW vehicle_utilization_view AS
SELECT
  r.tenant_id,
  r.vehicle_id,
  v.make,
  v.model,
  v.license_plate,
  COUNT(DISTINCT r.id) as rental_count,
  SUM(EXTRACT(DAY FROM (r.end_date - r.start_date))) as total_days_rented,
  SUM(r.total_amount) as total_revenue,
  AVG(r.total_amount) as avg_rental_value,
  MAX(r.end_date) as last_rental_end
FROM rentals r
JOIN vehicles v ON r.vehicle_id = v.id
WHERE r.status IN ('completed', 'active')
GROUP BY r.tenant_id, r.vehicle_id, v.make, v.model, v.license_plate;

-- Customer lifetime value view
CREATE OR REPLACE VIEW customer_lifetime_value_view AS
SELECT
  c.tenant_id,
  c.id as customer_id,
  c.full_name,
  c.email,
  c.phone,
  COUNT(DISTINCT r.id) as rental_count,
  SUM(r.total_amount) as lifetime_value,
  AVG(r.total_amount) as avg_rental_value,
  MAX(r.end_date) as last_rental_date,
  MIN(r.start_date) as first_rental_date
FROM customers c
LEFT JOIN rentals r ON c.id = r.customer_id AND r.status IN ('completed', 'active')
GROUP BY c.tenant_id, c.id, c.full_name, c.email, c.phone;

-- Rental status distribution view
CREATE OR REPLACE VIEW rental_status_distribution_view AS
SELECT
  tenant_id,
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY tenant_id), 2) as percentage
FROM rentals
GROUP BY tenant_id, status;

-- Monthly rental count view
CREATE OR REPLACE VIEW monthly_rental_count_view AS
SELECT
  tenant_id,
  DATE_TRUNC('month', start_date) as month_start,
  COUNT(*) as rental_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_rental_value
FROM rentals
WHERE status IN ('completed', 'active')
GROUP BY tenant_id, DATE_TRUNC('month', start_date);

-- Top performing vehicles view
CREATE OR REPLACE VIEW top_vehicles_view AS
SELECT
  tenant_id,
  vehicle_id,
  make,
  model,
  license_plate,
  rental_count,
  total_revenue,
  avg_rental_value,
  total_days_rented,
  CASE
    WHEN total_days_rented > 0 THEN ROUND(total_revenue / total_days_rented, 2)
    ELSE 0
  END as revenue_per_day
FROM vehicle_utilization_view
ORDER BY total_revenue DESC;

-- Top customers view
CREATE OR REPLACE VIEW top_customers_view AS
SELECT
  tenant_id,
  customer_id,
  full_name,
  email,
  phone,
  rental_count,
  lifetime_value,
  avg_rental_value,
  last_rental_date
FROM customer_lifetime_value_view
WHERE rental_count > 0
ORDER BY lifetime_value DESC;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  start_date := COALESCE(p_start_date, NOW() - INTERVAL '30 days');
  end_date := COALESCE(p_end_date, NOW());

  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', start_date,
      'end', end_date
    ),
    'revenue', (
      SELECT jsonb_build_object(
        'total', COALESCE(SUM(amount), 0),
        'count', COUNT(*),
        'average', COALESCE(AVG(amount), 0)
      )
      FROM payments
      WHERE tenant_id = p_tenant_id
        AND NOT is_refund
        AND created_at BETWEEN start_date AND end_date
    ),
    'rentals', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(DISTINCT CASE WHEN status = 'active' THEN id END),
        'completed', COUNT(DISTINCT CASE WHEN status = 'completed' THEN id END)
      )
      FROM rentals
      WHERE tenant_id = p_tenant_id
        AND start_date >= start_date
    ),
    'vehicles', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'rented', COUNT(DISTINCT CASE WHEN status = 'rented' THEN id END)
      )
      FROM vehicles
      WHERE tenant_id = p_tenant_id
    ),
    'customers', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'new', COUNT(DISTINCT CASE WHEN created_at >= start_date THEN id END)
      )
      FROM customers
      WHERE tenant_id = p_tenant_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;