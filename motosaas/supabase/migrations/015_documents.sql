-- Document Management tables for Issue #20
-- Run after 014_notifications.sql

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  rental_id UUID REFERENCES rentals(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('id_card', 'driving_license', 'insurance', 'contract', 'invoice', 'photo', 'other')),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document tags table
CREATE TABLE IF NOT EXISTS public.document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(document_id, tag)
);

-- RLS policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = documents.tenant_id));
CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = documents.tenant_id));
CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = documents.tenant_id));
CREATE POLICY "documents_delete" ON public.documents FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = documents.tenant_id));

-- RLS policies for document_tags
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_tags_select" ON public.document_tags FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM documents WHERE id = document_tags.document_id)));
CREATE POLICY "document_tags_insert" ON public.document_tags FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM documents WHERE id = document_tags.document_id)));
CREATE POLICY "document_tags_delete" ON public.document_tags FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM documents WHERE id = document_tags.document_id)));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON public.documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON public.documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_rental ON public.documents(rental_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_document_tags_document ON public.document_tags(document_id);