-- Fix SQL functions with incorrect column references

-- 1. Fix get_overdue_rentals() - references c.first_name, c.last_name, r.paid_amount
DROP FUNCTION IF EXISTS get_overdue_rentals(UUID);

CREATE OR REPLACE FUNCTION get_overdue_rentals(p_tenant_id UUID)
RETURNS TABLE (
  rental_id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  vehicle_info TEXT,
  days_overdue BIGINT,
  balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as rental_id,
    r.customer_id,
    c.full_name as customer_name,
    c.phone as customer_phone,
    v.make || ' ' || v.model as vehicle_info,
    EXTRACT(DAY FROM now() - r.end_date)::BIGINT as days_overdue,
    r.total_amount - COALESCE(
      (SELECT SUM(p.amount) FROM payments p WHERE p.rental_id = r.id AND p.is_refund = false),
      0
    ) as balance
  FROM rentals r
  JOIN customers c ON r.customer_id = c.id
  JOIN vehicles v ON r.vehicle_id = v.id
  WHERE r.tenant_id = p_tenant_id
    AND r.status IN ('active', 'overdue')
    AND r.end_date < now()
  ORDER BY r.end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_dashboard_stats() - references rental.payment_status and payment.payment_date
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID);

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
    (SELECT COUNT(*) FROM rentals r
     WHERE r.tenant_id = p_tenant_id
       AND r.status IN ('active', 'completed')
       AND r.total_amount - COALESCE(
         (SELECT SUM(p.amount) FROM payments p WHERE p.rental_id = r.id AND p.is_refund = false),
         0
       ) > 0
    ) as pending_payments,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = p_tenant_id) as total_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE tenant_id = p_tenant_id AND created_at >= DATE_TRUNC('month', NOW())) as monthly_revenue,
    (SELECT COUNT(*) FROM rentals WHERE tenant_id = p_tenant_id AND status = 'active' AND end_date < NOW()) as overdue_rentals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
