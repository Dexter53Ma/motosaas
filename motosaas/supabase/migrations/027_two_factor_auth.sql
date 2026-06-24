-- Two-Factor Authentication tables for Issue #37
-- Run after 026_sms_notifications.sql

-- 2FA settings table
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2FA verification tokens table
CREATE TABLE IF NOT EXISTS public.two_factor_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_2fa_select" ON public.user_2fa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_2fa_insert" ON public.user_2fa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_2fa_update" ON public.user_2fa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "two_factor_tokens_select" ON public.two_factor_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "two_factor_tokens_insert" ON public.two_factor_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_2fa_user ON public.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_tokens_user ON public.two_factor_tokens(user_id);