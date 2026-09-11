CREATE TABLE IF NOT EXISTS public.video_likes (
  content_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (content_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.live_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads video likes" ON public.video_likes;
DROP POLICY IF EXISTS "Users like videos" ON public.video_likes;
DROP POLICY IF EXISTS "Users remove own video likes" ON public.video_likes;
CREATE POLICY "Anyone reads video likes" ON public.video_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users like videos" ON public.video_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own video likes" ON public.video_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone reads live comments" ON public.live_comments;
DROP POLICY IF EXISTS "Users comment on lives" ON public.live_comments;
DROP POLICY IF EXISTS "Users remove own live comments" ON public.live_comments;
CREATE POLICY "Anyone reads live comments" ON public.live_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users comment on lives" ON public.live_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own live comments" ON public.live_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'video_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.video_likes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'live_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_comments;
  END IF;
END $$;