
-- Add onboarding tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS snapshot_type text NOT NULL DEFAULT 'member';

-- Create persistent chat history for AI memory per user
CREATE TABLE public.chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  mode text NOT NULL DEFAULT 'consultant',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_history_user_mode ON public.chat_history (user_id, mode, created_at DESC);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
ON public.chat_history FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
ON public.chat_history FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history"
ON public.chat_history FOR DELETE TO authenticated
USING (auth.uid() = user_id);
