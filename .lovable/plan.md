# Google Calendar Supabase Cache - Implementation Complete ✅

## Status: IMPLEMENTED

This plan established a server-side caching layer for Google Calendar events using Supabase, eliminating direct client-side API calls and enabling real-time sync via Google Calendar push notifications.

**Implementation completed:**
- ✅ Database schema created (4 tables)
- ✅ Edge functions deployed (5 functions)
- ✅ CalendarPanel refactored to use Supabase cache
- ✅ Realtime subscription for live updates

---

## 1. Database Schema

### A. `google_oauth_tokens` - OAuth Token Storage (Single User)

```sql
CREATE TABLE google_oauth_tokens (
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

-- Index for lookup
CREATE INDEX idx_oauth_tokens_user_label ON google_oauth_tokens(user_label);
```

### B. `gcal_sync_state` - Sync Token & Status Tracking

```sql
CREATE TABLE gcal_sync_state (
  calendar_id TEXT PRIMARY KEY DEFAULT 'primary',
  next_sync_token TEXT,
  last_full_sync_at TIMESTAMPTZ,
  last_incremental_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'idle', -- 'idle' | 'syncing' | 'error'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### C. `gcal_watch_channels` - Push Notification Channel Management

```sql
CREATE TABLE gcal_watch_channels (
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

-- Index for expiration checks
CREATE INDEX idx_watch_channels_expiration ON gcal_watch_channels(expiration_at);
```

### D. `gcal_events_cache` - Event Cache Table

```sql
CREATE TABLE gcal_events_cache (
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  event_id TEXT NOT NULL,
  status TEXT, -- 'confirmed' | 'tentative' | 'cancelled'
  html_link TEXT,
  
  -- Timestamps
  created TIMESTAMPTZ,
  updated TIMESTAMPTZ,
  
  -- Core event data (flattened for querying)
  summary TEXT,
  description TEXT,
  location TEXT,
  color_id TEXT,
  
  -- Date/Time as JSONB (handles date vs dateTime + timeZone)
  start_json JSONB NOT NULL,
  end_json JSONB NOT NULL,
  
  -- Recurrence
  recurrence JSONB, -- array of RRULE strings
  recurring_event_id TEXT,
  original_start_time JSONB,
  
  -- People
  organizer_json JSONB,
  creator_json JSONB,
  attendees_json JSONB,
  
  -- Settings
  reminders_json JSONB,
  visibility TEXT, -- 'default' | 'public' | 'private' | 'confidential'
  transparency TEXT, -- 'opaque' | 'transparent'
  
  -- Identifiers
  ical_uid TEXT,
  sequence INT DEFAULT 0,
  event_type TEXT, -- 'default' | 'outOfOffice' | 'focusTime' | 'workingLocation'
  
  -- Conferencing
  hangout_link TEXT,
  conference_data_json JSONB,
  
  -- Extras
  attachments_json JSONB,
  extended_properties_json JSONB,
  
  -- Full raw event for any unmapped fields
  raw_event_json JSONB NOT NULL,
  
  -- Soft delete & sync tracking
  deleted BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (calendar_id, event_id)
);

-- Indexes for common queries
CREATE INDEX idx_events_start ON gcal_events_cache USING GIN (start_json);
CREATE INDEX idx_events_status ON gcal_events_cache(status) WHERE deleted = FALSE;
CREATE INDEX idx_events_recurring ON gcal_events_cache(recurring_event_id) WHERE recurring_event_id IS NOT NULL;
CREATE INDEX idx_events_updated ON gcal_events_cache(updated);
CREATE INDEX idx_events_deleted ON gcal_events_cache(deleted);
```

---

## 2. Field Mapping Reference

| Google Event Field | Storage | Notes |
|--------------------|---------|-------|
| `id` | `event_id` (TEXT) | Primary key component |
| `status` | `status` (TEXT) | Flattened for filtering |
| `htmlLink` | `html_link` (TEXT) | Flattened |
| `created`, `updated` | `created`, `updated` (TIMESTAMPTZ) | Flattened for sorting |
| `summary` | `summary` (TEXT) | Flattened for search |
| `description` | `description` (TEXT) | Flattened for search |
| `location` | `location` (TEXT) | Flattened for search |
| `colorId` | `color_id` (TEXT) | Flattened |
| `start` | `start_json` (JSONB) | Contains `date` OR `dateTime` + `timeZone` |
| `end` | `end_json` (JSONB) | Contains `date` OR `dateTime` + `timeZone` |
| `recurrence` | `recurrence` (JSONB) | Array of RRULE strings |
| `recurringEventId` | `recurring_event_id` (TEXT) | Flattened for joins |
| `originalStartTime` | `original_start_time` (JSONB) | JSONB structure |
| `organizer` | `organizer_json` (JSONB) | Complex object |
| `creator` | `creator_json` (JSONB) | Complex object |
| `attendees` | `attendees_json` (JSONB) | Array of objects |
| `reminders` | `reminders_json` (JSONB) | Complex object |
| `visibility`, `transparency` | Flattened | Simple strings |
| `iCalUID`, `sequence`, `eventType` | Flattened | Simple values |
| `hangoutLink` | `hangout_link` (TEXT) | Flattened |
| `conferenceData` | `conference_data_json` (JSONB) | Complex object |
| `attachments` | `attachments_json` (JSONB) | Array |
| `extendedProperties` | `extended_properties_json` (JSONB) | Object |
| **Full event** | `raw_event_json` (JSONB) | Complete Google response |

---

## 3. Architecture Components

```text
+------------------+       +----------------------+       +------------------+
|                  |       |                      |       |                  |
|   Frontend UI    | <---> |   Supabase DB        | <---- |  Edge Functions  |
|   (CalendarPanel)|       |   (gcal_events_cache)|       |                  |
|                  |       |                      |       +--------+---------+
+------------------+       +----------------------+                |
                                                                   |
                                                          +--------v---------+
                                                          |                  |
                                                          | Google Calendar  |
                                                          |      API         |
                                                          |                  |
                                                          +------------------+
```

### Edge Functions Required

| Function | Purpose |
|----------|---------|
| `gcal-webhook` | Receives Google push notifications, triggers incremental sync |
| `gcal-sync` | Performs full or incremental sync using syncToken |
| `gcal-oauth-callback` | Handles OAuth redirect, stores refresh token |
| `gcal-token-refresh` | Refreshes access token using stored refresh token |
| `gcal-watch-setup` | Creates/renews events.watch channel |
| `gcal-event-mutate` | Creates/updates/deletes events via Google API |

---

## 4. Frontend Files to Refactor

| File | Current State | Target State |
|------|---------------|--------------|
| `src/lib/googleCalendar.ts` | Direct Google API calls, client-side OAuth | **Remove or replace** with Supabase client calls |
| `src/components/tasks/CalendarPanel.tsx` | Imports Google API functions, manages auth state | Read from `gcal_events_cache` table, call edge functions for mutations |
| `src/components/calendar/GoogleCalendarEventModal.tsx` | UI only, no direct API calls | No changes needed (delegates to parent) |

### Key Changes in CalendarPanel.tsx

1. **Remove imports** from `@/lib/googleCalendar`
2. **Replace `listEvents()`** with Supabase query:
   ```typescript
   const { data } = await supabase
     .from('gcal_events_cache')
     .select('*')
     .eq('calendar_id', 'primary')
     .eq('deleted', false)
     .gte('start_json->dateTime', monthStart.toISOString())
     .lte('start_json->dateTime', monthEnd.toISOString());
   ```
3. **Replace `createEvent/updateEvent/deleteEvent`** with edge function calls
4. **Remove Google OAuth UI** (Connect/Disconnect buttons) - OAuth handled once during setup
5. **Add Supabase realtime subscription** for live updates when webhook syncs new data

---

## 5. Sync Flow

### Initial Full Sync
1. User completes OAuth via `gcal-oauth-callback`
2. Call `gcal-sync` with `fullSync: true`
3. Fetch all events, store in cache, save `nextSyncToken`
4. Call `gcal-watch-setup` to enable push notifications

### Push Notification Flow
1. Google sends POST to `gcal-webhook`
2. Webhook validates `X-Goog-Channel-Token`
3. Triggers `gcal-sync` with `incrementalSync: true`
4. Fetch changes using `syncToken`, upsert/delete in cache
5. Update `next_sync_token` in `gcal_sync_state`

### Channel Renewal
1. Cron job checks `gcal_watch_channels.expiration_at`
2. Renew channels expiring within 24 hours

---

## 6. Security Considerations

- **OAuth tokens**: Store `refresh_token` in `google_oauth_tokens` (consider encrypting at rest)
- **Webhook validation**: Verify `X-Goog-Channel-Token` matches stored `channel_token`
- **RLS**: Not needed for single-user, but add if multi-user in future
- **Secrets**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` already in Supabase secrets

---

## 7. Implementation Order

1. Create database tables via migration
2. Create `gcal-oauth-callback` edge function
3. Create `gcal-token-refresh` helper function
4. Create `gcal-sync` edge function (full + incremental)
5. Create `gcal-webhook` edge function
6. Create `gcal-watch-setup` edge function
7. Create `gcal-event-mutate` edge function
8. Refactor `CalendarPanel.tsx` to use Supabase
9. Remove/deprecate `src/lib/googleCalendar.ts`
10. Add Supabase realtime subscription for live updates

---

## Technical Notes

- **Why JSONB for start/end?** Google Calendar events can have either `date` (all-day) or `dateTime` + `timeZone`. JSONB preserves the original structure.
- **Why raw_event_json?** Ensures 100% fidelity with Google - any new fields Google adds are automatically captured.
- **syncToken** is crucial - it allows fetching only changed events instead of full re-sync.
- **Push notifications** don't contain event data - they only signal "something changed", requiring a follow-up sync call.
