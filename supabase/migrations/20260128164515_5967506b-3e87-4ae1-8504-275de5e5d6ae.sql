-- Google Calendar Supabase Cache Schema

-- A. google_oauth_tokens - OAuth Token Storage (Single User)
CREATE TABLE public.google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_label TEXT NOT NULL DEFAULT 'default',
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expiry TIMESTAMPTZ,
  scopes TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/calendar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_label)
);

CREATE INDEX idx_oauth_tokens_user_label ON public.google_oauth_tokens(user_label);

-- B. gcal_sync_state - Sync Token & Status Tracking
CREATE TABLE public.gcal_sync_state (
  calendar_id TEXT PRIMARY KEY DEFAULT 'primary',
  next_sync_token TEXT,
  last_full_sync_at TIMESTAMPTZ,
  last_incremental_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. gcal_watch_channels - Push Notification Channel Management
CREATE TABLE public.gcal_watch_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  channel_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  channel_token TEXT NOT NULL,
  expiration_ms BIGINT NOT NULL,
  expiration_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calendar_id)
);

CREATE INDEX idx_watch_channels_expiration ON public.gcal_watch_channels(expiration_at);

-- D. gcal_events_cache - Event Cache Table
CREATE TABLE public.gcal_events_cache (
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  event_id TEXT NOT NULL,
  status TEXT,
  html_link TEXT,
  created TIMESTAMPTZ,
  updated TIMESTAMPTZ,
  summary TEXT,
  description TEXT,
  location TEXT,
  color_id TEXT,
  start_json JSONB NOT NULL,
  end_json JSONB NOT NULL,
  recurrence JSONB,
  recurring_event_id TEXT,
  original_start_time JSONB,
  organizer_json JSONB,
  creator_json JSONB,
  attendees_json JSONB,
  reminders_json JSONB,
  visibility TEXT,
  transparency TEXT,
  ical_uid TEXT,
  sequence INT DEFAULT 0,
  event_type TEXT,
  hangout_link TEXT,
  conference_data_json JSONB,
  attachments_json JSONB,
  extended_properties_json JSONB,
  raw_event_json JSONB NOT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (calendar_id, event_id)
);

CREATE INDEX idx_events_start ON public.gcal_events_cache USING GIN (start_json);
CREATE INDEX idx_events_status ON public.gcal_events_cache(status) WHERE deleted = FALSE;
CREATE INDEX idx_events_recurring ON public.gcal_events_cache(recurring_event_id) WHERE recurring_event_id IS NOT NULL;
CREATE INDEX idx_events_updated ON public.gcal_events_cache(updated);
CREATE INDEX idx_events_deleted ON public.gcal_events_cache(deleted);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON public.google_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gcal_sync_state_updated_at
  BEFORE UPDATE ON public.gcal_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gcal_watch_channels_updated_at
  BEFORE UPDATE ON public.gcal_watch_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();