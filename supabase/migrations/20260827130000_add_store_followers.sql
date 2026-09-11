CREATE TABLE IF NOT EXISTS public.store_followers (
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, user_id)
);

CREATE INDEX IF NOT EXISTS store_followers_user_id_idx ON public.store_followers(user_id);

ALTER TABLE public.store_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads store followers" ON public.store_followers;
DROP POLICY IF EXISTS "Users follow stores" ON public.store_followers;
DROP POLICY IF EXISTS "Users unfollow stores" ON public.store_followers;

CREATE POLICY "Anyone reads store followers"
ON public.store_followers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users follow stores"
ON public.store_followers FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users unfollow stores"
ON public.store_followers FOR DELETE TO authenticated
USING (auth.uid() = user_id);