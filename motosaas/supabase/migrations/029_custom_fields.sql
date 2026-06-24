-- Custom Fields tables for Issue #40
-- Run after 028_role_permissions.sql

-- Custom fields definition table
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customer', 'vehicle', 'rental')),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'select')),
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, entity_type, name)
);

-- Custom field values table
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(field_id, entity_id)
);

-- RLS policies
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_fields_select" ON public.custom_fields FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_fields.tenant_id));
CREATE POLICY "custom_fields_insert" ON public.custom_fields FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_fields.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "custom_fields_update" ON public.custom_fields FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_fields.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "custom_fields_delete" ON public.custom_fields FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_fields.tenant_id AND role IN ('owner', 'manager')));
CREATE POLICY "custom_field_values_select" ON public.custom_field_values FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_field_values.tenant_id));
CREATE POLICY "custom_field_values_insert" ON public.custom_field_values FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_field_values.tenant_id));
CREATE POLICY "custom_field_values_update" ON public.custom_field_values FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = custom_field_values.tenant_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_tenant ON public.custom_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_tenant ON public.custom_field_values(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity ON public.custom_field_values(entity_id);