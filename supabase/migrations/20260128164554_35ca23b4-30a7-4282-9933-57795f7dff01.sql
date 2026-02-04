-- Enable RLS on all tables (service role will bypass RLS)
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcal_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcal_watch_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcal_events_cache ENABLE ROW LEVEL SECURITY;

-- Allow read access to events cache for the app (public can read cached events)
CREATE POLICY "Anyone can read cached events"
  ON public.gcal_events_cache FOR SELECT
  USING (deleted = false);

-- No direct insert/update/delete from client - only edge functions with service role
CREATE POLICY "Service role manages events"
  ON public.gcal_events_cache FOR ALL
  USING (auth.role() = 'service_role');

-- OAuth tokens, sync state, watch channels are service-role only
CREATE POLICY "Service role manages oauth tokens"
  ON public.google_oauth_tokens FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages sync state"
  ON public.gcal_sync_state FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages watch channels"
  ON public.gcal_watch_channels FOR ALL
  USING (auth.role() = 'service_role');

-- Fix function search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;