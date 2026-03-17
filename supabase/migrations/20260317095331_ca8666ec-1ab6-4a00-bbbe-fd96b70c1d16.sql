
-- Snapshots table
CREATE TABLE public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_type text NOT NULL DEFAULT 'member',
  purpose_statement text NOT NULL DEFAULT '',
  quarterly_goal text NOT NULL DEFAULT '',
  major_issue text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Snapshot ratings table (one row per category per snapshot)
CREATE TABLE public.snapshot_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.snapshots(id) ON DELETE CASCADE,
  category_id text NOT NULL,
  score integer NOT NULL DEFAULT 5 CHECK (score >= 1 AND score <= 10),
  spouse_score integer CHECK (spouse_score >= 1 AND spouse_score <= 10),
  child_score integer CHECK (child_score >= 1 AND child_score <= 10),
  note text,
  life_event text,
  UNIQUE(snapshot_id, category_id)
);

-- Indexes
CREATE INDEX idx_snapshots_user_id ON public.snapshots(user_id);
CREATE INDEX idx_snapshots_created_at ON public.snapshots(created_at DESC);
CREATE INDEX idx_snapshot_ratings_snapshot_id ON public.snapshot_ratings(snapshot_id);

-- RLS on snapshots
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.snapshots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON public.snapshots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots"
  ON public.snapshots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots"
  ON public.snapshots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS on snapshot_ratings
ALTER TABLE public.snapshot_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshot ratings"
  ON public.snapshot_ratings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own snapshot ratings"
  ON public.snapshot_ratings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own snapshot ratings"
  ON public.snapshot_ratings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own snapshot ratings"
  ON public.snapshot_ratings FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.snapshots s WHERE s.id = snapshot_id AND s.user_id = auth.uid()
  ));
