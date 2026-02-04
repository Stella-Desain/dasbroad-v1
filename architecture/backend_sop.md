# Architecture SOP: Backend & Integration

## Goal
To manage data integrity, synchronization with Google Calendar, and authentications.

## Technology Stack
- **Database**: Supabase (PostgreSQL)
- **API**: Supabase REST API & Edge Functions (Deno)
- **Authentication**: Supabase Auth

## Logic Rules
1. **Source of Truth**: Database is the master. Client logic follows DB state.
2. **Deterministic Scripts**: `tools/` scripts must return predictable outputs.
3. **Edge Functions**: Use for complex server-side logic (Sync, Secrets access).

## Google Calendar Sync
1. **Polling/Webhooks**: Use configured Edge Functions (`gcal-sync`, `gcal-watch-setup`) for synchronization.
2. **Token Management**: Refresh tokens must be handled securely in Edge Functions.
3. **Conflict Resolution**: Last write wins (or prefer GCal for external events).

## Error Handling
- **API Errors**: Log to Console (Dev) and Toast (User).
- **Sync Errors**: Store in `gcal_sync_state.error_message`.
