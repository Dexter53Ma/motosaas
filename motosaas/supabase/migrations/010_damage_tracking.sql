-- Damage Tracking tables for Issue #13
-- Run after 009_admin.sql

-- Damage reports table
CREATE TABLE IF NOT EXISTS public.damage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id),
  damage_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  damage_type TEXT NOT NULL CHECK (damage_type IN ('scratch', 'dent', 'crack', 'broken', 'stain', 'mechanical', 'other')),
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'total')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'assessed', 'repaired', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Damage photos table
CREATE TABLE IF NOT EXISTS public.damage_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_before BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Damage assessments table
CREATE TABLE IF NOT EXISTS public.damage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  assessed_by UUID NOT NULL REFERENCES users(id),
  assessment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  estimated_repair_cost DECIMAL(12,2) NOT NULL,
  repair_time_days INTEGER,
  needs_replacement BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for damage_reports
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "damage_reports_select" ON public.damage_reports FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = damage_reports.tenant_id));
CREATE POLICY "damage_reports_insert" ON public.damage_reports FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = damage_reports.tenant_id));
CREATE POLICY "damage_reports_update" ON public.damage_reports FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = damage_reports.tenant_id));

-- RLS policies for damage_photos
ALTER TABLE public.damage_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "damage_photos_select" ON public.damage_photos FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM damage_reports WHERE id = damage_photos.damage_report_id)));
CREATE POLICY "damage_photos_insert" ON public.damage_photos FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM damage_reports WHERE id = damage_photos.damage_report_id)));
CREATE POLICY "damage_photos_delete" ON public.damage_photos FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM damage_reports WHERE id = damage_photos.damage_report_id)));

-- RLS policies for damage_assessments
ALTER TABLE public.damage_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "damage_assessments_select" ON public.damage_assessments FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM damage_reports WHERE id = damage_assessments.damage_report_id)));
CREATE POLICY "damage_assessments_insert" ON public.damage_assessments FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM damage_reports WHERE id = damage_assessments.damage_report_id)));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_damage_reports_tenant ON public.damage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_rental ON public.damage_reports(rental_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle ON public.damage_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON public.damage_reports(status);
CREATE INDEX IF NOT EXISTS idx_damage_photos_report ON public.damage_photos(damage_report_id);
CREATE INDEX IF NOT EXISTS idx_damage_assessments_report ON public.damage_assessments(damage_report_id);

-- Function to get damage summary for vehicle
CREATE OR REPLACE FUNCTION get_vehicle_damage_summary(p_vehicle_id UUID)
RETURNS TABLE (
  total_reports BIGINT,
  total_cost DECIMAL,
  last_report_date TIMESTAMPTZ,
  severity_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_reports,
    COALESCE(SUM(actual_cost), 0) as total_cost,
    MAX(created_at) as last_report_date,
    jsonb_object_agg(severity, count) as severity_counts
  FROM (
    SELECT severity, COUNT(*) as count
    FROM damage_reports
    WHERE vehicle_id = p_vehicle_id
    GROUP BY severity
  ) severity_counts,
  damage_reports dr
  WHERE dr.vehicle_id = p_vehicle_id
  GROUP BY dr.vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;