CREATE TABLE IF NOT EXISTS public.video_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS video_shares_content_id_idx ON public.video_shares(content_id);

ALTER TABLE public.video_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads video shares" ON public.video_shares;
DROP POLICY IF EXISTS "Anyone records video shares" ON public.video_shares;

CREATE POLICY "Anyone reads video shares"
ON public.video_shares FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone records video shares"
ON public.video_shares FOR INSERT TO anon, authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);