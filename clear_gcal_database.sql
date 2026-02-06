-- Clear All Google Calendar Data
-- Use this to reset database for fresh testing

-- 1. Delete all cached events
DELETE FROM gcal_events_cache;

-- 2. Delete all watch channels
DELETE FROM gcal_watch_channels;

-- 3. Delete sync state
DELETE FROM gcal_sync_state;

-- 4. Delete OAuth tokens
DELETE FROM google_oauth_tokens;

-- Verify all tables are empty
SELECT 'gcal_events_cache' as table_name, COUNT(*) as count FROM gcal_events_cache
UNION ALL
SELECT 'gcal_watch_channels', COUNT(*) FROM gcal_watch_channels
UNION ALL
SELECT 'gcal_sync_state', COUNT(*) FROM gcal_sync_state
UNION ALL
SELECT 'google_oauth_tokens', COUNT(*) FROM google_oauth_tokens;

-- Expected result: all counts should be 0
