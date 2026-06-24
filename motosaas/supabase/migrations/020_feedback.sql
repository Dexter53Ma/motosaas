-- User Feedback tables for Issue #30
-- Run after 019_customer_portal.sql

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'question', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'implemented', 'declined')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback votes table
CREATE TABLE IF NOT EXISTS public.feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- RLS policies for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select" ON public.feedback FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = feedback.tenant_id));
CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = feedback.tenant_id));
CREATE POLICY "feedback_update" ON public.feedback FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = feedback.tenant_id));

-- RLS policies for feedback_votes
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_votes_select" ON public.feedback_votes FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM feedback WHERE id = feedback_votes.feedback_id)));
CREATE POLICY "feedback_votes_insert" ON public.feedback_votes FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM feedback WHERE id = feedback_votes.feedback_id)));
CREATE POLICY "feedback_votes_update" ON public.feedback_votes FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_tenant ON public.feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON public.feedback_votes(feedback_id);