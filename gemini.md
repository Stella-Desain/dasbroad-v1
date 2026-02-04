# Project Constitution

## 🌟 North Star
Dashboard yang dapat memanajemen task project dengan lebih efisien dan terhubung dengan Google Calendar.

## 🔗 Integrations
- **Google Calendar API**: Sync events, manage schedules.
- **Supabase**: Primary database (Source of Truth), Auth.
- **Vercel**: Deployment platform.

## 🏛️ Source of Truth
**Supabase** is the primary source of truth for all data.

## 📦 Delivery Payload
- **Web Application**: Deployed on Vercel.

## 🤖 Behavioral Rules
- **Design Style**: **Google Material Design 3**. Follow Google Calendar's aesthetic (Clean, Rounded, Pastel colors, FABs).
- Prioritaskan pengalaman pengguna yang responsif dan interaktif.
- Gunakan bahasa profesional dan ringkas.

## 💾 Data Schemas

### Database Schema (Supabase)
Derived from `src/integrations/supabase/types.ts`.

#### `gcal_events_cache`
Stores cached Google Calendar events.
```json
{
  "event_id": "string (PK)",
  "calendar_id": "string",
  "summary": "string | null",
  "description": "string | null",
  "location": "string | null",
  "start_json": "Json (dateTime, timeZone)",
  "end_json": "Json (dateTime, timeZone)",
  "status": "string | null",
  "html_link": "string | null",
  "created": "string | null",
  "updated": "string | null",
  "raw_event_json": "Json (Full GCal Event Object)"
}
```

#### `gcal_sync_state`
Tracks synchronization status for calendars.
```json
{
  "calendar_id": "string (PK)",
  "next_sync_token": "string | null",
  "last_full_sync_at": "string | null",
  "last_incremental_sync_at": "string | null",
  "status": "string | null"
}
```

#### `google_oauth_tokens`
Stores OAuth tokens for Google integrations.
```json
{
  "id": "string (PK)",
  "user_label": "string",
  "access_token": "string | null",
  "refresh_token": "string",
  "token_expiry": "string | null",
  "scopes": "string"
}
```

### Application State Schema (Zustand)
Derived from `src/stores/appStore.ts`.

#### `Task`
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "startDate": "string",
  "endDate": "string",
  "time": "string?",
  "type": "'task' | 'event'",
  "priority": "'low' | 'medium' | 'high' | 'critical'",
  "status": "'pending' | 'in-progress' | 'completed'",
  "projectId": "string?",
  "assignees": "string[]",
  "repeat": "'none' | 'daily' | 'weekly' | 'monthly'",
  "color": "string"
}
```

#### `Project`
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "priority": "'low' | 'medium' | 'high' | 'critical'",
  "status": "'backlog' | 'scheduled' | 'in-progress' | 'completed'",
  "startDate": "string?",
  "deadline": "string?",
  "progress": "number",
  "assignees": "string[]"
}
```

## Maintenance Log
- [init] Initial Constitution created.
- [blueprint] Defined Schemas based on existing code.
- [stylize] Updated Design Rules to match Google Material Design.
