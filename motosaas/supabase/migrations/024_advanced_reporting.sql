-- Advanced Reporting tables for Issue #34
-- Run after 023_multi_currency.sql

-- Saved reports table
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'vehicles', 'customers', 'rentals', 'custom')),
  config JSONB NOT NULL DEFAULT '{}',
  schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly', NULL)),
  last_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report exports table
CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID REFERENCES saved_reports(id),
  format TEXT NOT NULL CHECK (format IN ('csv', 'pdf', 'xlsx')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_reports_select" ON public.saved_reports FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = saved_reports.tenant_id));
CREATE POLICY "saved_reports_insert" ON public.saved_reports FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = saved_reports.tenant_id));
CREATE POLICY "saved_reports_update" ON public.saved_reports FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = saved_reports.tenant_id));
CREATE POLICY "saved_reports_delete" ON public.saved_reports FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = saved_reports.tenant_id));
CREATE POLICY "report_exports_select" ON public.report_exports FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = report_exports.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_tenant ON public.saved_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_tenant ON public.report_exports(tenant_id);