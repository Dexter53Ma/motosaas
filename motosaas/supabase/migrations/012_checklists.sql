-- Checklists tables for Issue #15
-- Run after 011_customer_ratings.sql

-- Checklist templates table
CREATE TABLE IF NOT EXISTS public.checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checkout', 'return', 'inspection', 'maintenance')),
  items JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklist instances table (for actual checklists filled out)
CREATE TABLE IF NOT EXISTS public.checklist_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Checklist items table (for tracking individual items)
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES checklist_instances(id) ON DELETE CASCADE,
  item_label TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES users(id),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for checklist_templates
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_select" ON public.checklist_templates FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_templates.tenant_id));
CREATE POLICY "checklist_templates_insert" ON public.checklist_templates FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_templates.tenant_id));
CREATE POLICY "checklist_templates_update" ON public.checklist_templates FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_templates.tenant_id));
CREATE POLICY "checklist_templates_delete" ON public.checklist_templates FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_templates.tenant_id));

-- RLS policies for checklist_instances
ALTER TABLE public.checklist_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_instances_select" ON public.checklist_instances FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_instances.tenant_id));
CREATE POLICY "checklist_instances_insert" ON public.checklist_instances FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_instances.tenant_id));
CREATE POLICY "checklist_instances_update" ON public.checklist_instances FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = checklist_instances.tenant_id));

-- RLS policies for checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_select" ON public.checklist_items FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM checklist_instances WHERE id = checklist_items.instance_id)));
CREATE POLICY "checklist_items_insert" ON public.checklist_items FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM checklist_instances WHERE id = checklist_items.instance_id)));
CREATE POLICY "checklist_items_update" ON public.checklist_items FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM checklist_instances WHERE id = checklist_items.instance_id)));
CREATE POLICY "checklist_items_delete" ON public.checklist_items FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM checklist_instances WHERE id = checklist_items.instance_id)));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklist_templates_tenant ON public.checklist_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_tenant ON public.checklist_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_rental ON public.checklist_instances(rental_id);
CREATE INDEX IF NOT EXISTS idx_checklist_instances_vehicle ON public.checklist_instances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_instance ON public.checklist_items(instance_id);