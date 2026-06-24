-- Payments and Invoices tables for Issue #6
-- Run after 004_rentals.sql

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00, -- TVA 20%
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Line items for invoices (rental + extras)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(8,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment tracking columns to rentals
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS deposit_status TEXT NOT NULL DEFAULT 'none' CHECK (deposit_status IN ('none', 'held', 'returned', 'deducted'));
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS deposit_notes TEXT;

-- Update existing payments table with more details
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'mobile_money', 'other'));
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- RLS policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = invoices.tenant_id));
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = invoices.tenant_id));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = invoices.tenant_id));
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = invoices.tenant_id AND role = 'owner'));

-- RLS policies for invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM invoices WHERE id = invoice_items.invoice_id)));
CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM invoices WHERE id = invoice_items.invoice_id)));
CREATE POLICY "invoice_items_delete" ON public.invoice_items FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM invoices WHERE id = invoice_items.invoice_id) AND role = 'owner'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_rental ON public.invoices(rental_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method);

-- Auto-update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update subtotal from line items
  UPDATE invoices
  SET subtotal = COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0),
      tax_amount = COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0) * tax_rate / 100,
      total = COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0) +
              (COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = NEW.invoice_id), 0) * tax_rate / 100),
      updated_at = now()
  WHERE id = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();