-- Customer Ratings table for Issue #14
-- Run after 010_damage_tracking.sql

-- Customer ratings table
CREATE TABLE IF NOT EXISTS public.customer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT NOT NULL DEFAULT 'overall' CHECK (category IN ('overall', 'payment', 'vehicle_care', 'communication', 'punctuality')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for customer_ratings
ALTER TABLE public.customer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_ratings_select" ON public.customer_ratings FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_ratings.tenant_id));
CREATE POLICY "customer_ratings_insert" ON public.customer_ratings FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_ratings.tenant_id));
CREATE POLICY "customer_ratings_update" ON public.customer_ratings FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = customer_ratings.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_ratings_tenant ON public.customer_ratings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_customer ON public.customer_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ratings_rental ON public.customer_ratings(rental_id);

-- Function to get customer rating summary
CREATE OR REPLACE FUNCTION get_customer_rating_summary(p_customer_id UUID)
RETURNS TABLE (
  total_ratings BIGINT,
  average_rating NUMERIC,
  rating_distribution JSONB,
  category_averages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_ratings,
    ROUND(AVG(rating), 2) as average_rating,
    jsonb_object_agg(rating::text, count) as rating_distribution,
    jsonb_object_agg(category, avg_rating) as category_averages
  FROM (
    SELECT rating, COUNT(*) as count
    FROM customer_ratings
    WHERE customer_id = p_customer_id
    GROUP BY rating
  ) rating_counts,
  (
    SELECT category, ROUND(AVG(rating), 2) as avg_rating
    FROM customer_ratings
    WHERE customer_id = p_customer_id
    GROUP BY category
  ) category_avgs,
  customer_ratings cr
  WHERE cr.customer_id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;