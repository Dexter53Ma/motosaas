-- Multi-Currency Support tables for Issue #33
-- Run after 022_payment_gateways.sql

-- Currencies table
CREATE TABLE IF NOT EXISTS public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add currency to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MAD';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12,2);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12,6);

-- RLS policies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "currencies_select" ON public.currencies FOR SELECT USING (true);
CREATE POLICY "exchange_rates_select" ON public.exchange_rates FOR SELECT USING (true);

-- Insert default currencies
INSERT INTO currencies (code, name, symbol, decimal_places, is_default) VALUES
('MAD', 'Moroccan Dirham', 'MAD', 2, true),
('EUR', 'Euro', 'EUR', 2, false),
('USD', 'US Dollar', 'USD', 2, false);

-- Insert default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, source) VALUES
('EUR', 'MAD', 10.80, 'manual'),
('USD', 'MAD', 9.90, 'manual'),
('MAD', 'EUR', 0.0926, 'manual'),
('MAD', 'USD', 0.1010, 'manual');