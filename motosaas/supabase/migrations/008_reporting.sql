-- Reporting Dashboard tables/functions for Issue #9
-- Run after 007_payment_reminders.sql

-- Revenue summary view
CREATE OR REPLACE VIEW public.revenue_summary AS
SELECT
  p.tenant_id,
  DATE_TRUNC('day', p.created_at)::DATE as payment_date,
  COUNT(*) as transaction_count,
  SUM(p.amount) as total_revenue,
  SUM(CASE WHEN p.payment_method = 'cash' THEN p.amount ELSE 0 END) as cash_revenue,
  SUM(CASE WHEN p.payment_method = 'card' THEN p.amount ELSE 0 END) as card_revenue,
  SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END) as bank_transfer_revenue,
  SUM(CASE WHEN p.payment_method = 'mobile_money' THEN p.amount ELSE 0 END) as mobile_money_revenue
FROM payments p
GROUP BY p.tenant_id, DATE_TRUNC('day', p.created_at)::DATE;

-- Monthly revenue view
CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT
  p.tenant_id,
  DATE_TRUNC('month', p.created_at)::DATE as month,
  COUNT(*) as transaction_count,
  SUM(p.amount) as total_revenue
FROM payments p
GROUP BY p.tenant_id, DATE_TRUNC('month', p.created_at)::DATE;

-- Vehicle utilization view
CREATE OR REPLACE VIEW public.vehicle_utilization AS
SELECT
  v.tenant_id,
  v.id as vehicle_id,
  v.make,
  v.model,
  v.year,
  v.license_plate,
  COUNT(r.id) as total_rentals,
  SUM(EXTRACT(DAY FROM (LEAST(COALESCE(r.end_date, NOW()), NOW()) - GREATEST(r.start_date, NOW() - INTERVAL '365 days')))) as days_rented,
  ROUND(SUM(EXTRACT(DAY FROM (LEAST(COALESCE(r.end_date, NOW()), NOW()) - GREATEST(r.start_date, NOW() - INTERVAL '365 days')))) / 365.0 * 100, 1) as utilization_rate,
  SUM(r.total_amount) as total_revenue
FROM vehicles v
LEFT JOIN rentals r ON v.id = r.vehicle_id AND r.status IN ('completed', 'active')
WHERE v.tenant_id IS NOT NULL
GROUP BY v.tenant_id, v.id, v.make, v.model, v.year, v.license_plate;

-- Customer analytics view
CREATE OR REPLACE VIEW public.customer_analytics AS
SELECT
  c.tenant_id,
  c.id as customer_id,
  c.full_name,
  c.phone,
  COUNT(r.id) as total_rentals,
  SUM(r.total_amount) as total_spent,
  AVG(r.total_amount) as avg_rental_value,
  MIN(r.start_date) as first_rental_date,
  MAX(r.end_date) as last_rental_date,
  CASE
    WHEN COUNT(r.id) >= 5 THEN 'VIP'
    WHEN COUNT(r.id) >= 3 THEN 'Regular'
    WHEN COUNT(r.id) >= 1 THEN 'New'
    ELSE 'Prospect'
  END as customer_segment
FROM customers c
LEFT JOIN rentals r ON c.id = r.customer_id
WHERE c.tenant_id IS NOT NULL
GROUP BY c.tenant_id, c.id, c.full_name, c.phone;

-- Rental status distribution view
CREATE OR REPLACE VIEW public.rental_status_distribution AS
SELECT
  tenant_id,
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_value,
  AVG(total_amount) as avg_value
FROM rentals
GROUP BY tenant_id, status;

-- Daily rental stats view
CREATE OR REPLACE VIEW public.daily_rental_stats AS
SELECT
  tenant_id,
  DATE_TRUNC('day', start_date)::DATE as rental_date,
  COUNT(*) as rentals_started,
  SUM(total_amount) as total_value
FROM rentals
WHERE status IN ('active', 'completed')
GROUP BY tenant_id, DATE_TRUNC('day', start_date)::DATE;

-- Function to get revenue report for date range
CREATE OR REPLACE FUNCTION get_revenue_report(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  report_date DATE,
  transaction_count BIGINT,
  total_revenue DECIMAL,
  cash_revenue DECIMAL,
  card_revenue DECIMAL,
  bank_transfer_revenue DECIMAL,
  mobile_money_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rs.payment_date,
    rs.transaction_count,
    rs.total_revenue,
    rs.cash_revenue,
    rs.card_revenue,
    rs.bank_transfer_revenue,
    rs.mobile_money_revenue
  FROM revenue_summary rs
  WHERE rs.tenant_id = p_tenant_id
    AND (p_start_date IS NULL OR rs.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR rs.payment_date <= p_end_date)
  ORDER BY rs.payment_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vehicle utilization report
CREATE OR REPLACE FUNCTION get_vehicle_utilization_report(p_tenant_id UUID)
RETURNS TABLE (
  vehicle_id UUID,
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT,
  total_rentals BIGINT,
  days_rented NUMERIC,
  utilization_rate NUMERIC,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vu.vehicle_id,
    vu.make,
    vu.model,
    vu.year,
    vu.license_plate,
    vu.total_rentals,
    vu.days_rented,
    vu.utilization_rate,
    vu.total_revenue
  FROM vehicle_utilization vu
  WHERE vu.tenant_id = p_tenant_id
  ORDER BY vu.total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer analytics report
CREATE OR REPLACE FUNCTION get_customer_analytics_report(p_tenant_id UUID)
RETURNS TABLE (
  customer_id UUID,
  full_name TEXT,
  phone TEXT,
  total_rentals BIGINT,
  total_spent DECIMAL,
  avg_rental_value DECIMAL,
  first_rental_date DATE,
  last_rental_date DATE,
  customer_segment TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.customer_id,
    ca.full_name,
    ca.phone,
    ca.total_rentals,
    ca.total_spent,
    ca.avg_rental_value,
    ca.first_rental_date,
    ca.last_rental_date,
    ca.customer_segment
  FROM customer_analytics ca
  WHERE ca.tenant_id = p_tenant_id
  ORDER BY ca.total_spent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_vehicles BIGINT,
  available_vehicles BIGINT,
  rented_vehicles BIGINT,
  maintenance_vehicles BIGINT,
  total_customers BIGINT,
  active_rentals BIGINT,
  pending_payments BIGINT,
  total_revenue DECIMAL,
  monthly_revenue DECIMAL,
  overdue_rentals BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id) as total_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id AND status = 'available') as available_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id AND status = 'rented') as rented_vehicles,
    (SELECT COUNT(*) FROM vehicles WHERE tenant_id = p_tenant_id AND status = 'maintenance') as maintenance_vehicles,
    (SELECT COUNT(*) FROM customers WHERE tenant_id = p_tenant_id) as total_customers,
    (SELECT COUNT(*) FROM rentals WHERE tenant_id = p_tenant_id AND status = 'active') as active_rentals,
    (SELECT COUNT(*) FROM rentals WHERE tenant_id = p_tenant_id AND payment_status != 'paid' AND status IN ('active', 'completed')) as pending_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = p_tenant_id) as total_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = p_tenant_id AND payment_date >= DATE_TRUNC('month', NOW())) as monthly_revenue,
    (SELECT COUNT(*) FROM rentals WHERE tenant_id = p_tenant_id AND status = 'active' AND end_date < NOW()) as overdue_rentals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;