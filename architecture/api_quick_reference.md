# Backend API Quick Reference

## Base URL
```
https://your-project.supabase.co/functions/v1
```

---

## Endpoints

### 📥 GET `/gcal-events` - Fetch Cached Events

**Query Params**:
- `start` (required): `YYYY-MM-DD`
- `end` (required): `YYYY-MM-DD`
- `calendarId` (optional): defaults to `'primary'`

**Example**:
```bash
GET /gcal-events?start=2026-02-01&end=2026-02-28
```

**Response**:
```json
{
  "success": true,
  "events": [...],
  "count": 10
}
```

---

### ✏️ POST `/gcal-event-mutate` - Create/Update/Delete Events

**Body**:
```json
{
  "action": "create" | "update" | "delete",
  "eventId": "string", // required for update/delete
  "event": { ... } // required for create/update
}
```

#### Create Event
```json
{
  "action": "create",
  "event": {
    "summary": "Meeting",
    "start": { "dateTime": "2026-02-10T14:00:00", "timeZone": "America/New_York" },
    "end": { "dateTime": "2026-02-10T15:00:00", "timeZone": "America/New_York" }
  }
}
```

#### Update Event
```json
{
  "action": "update",
  "eventId": "abc123",
  "event": {
    "summary": "Updated Title"
  }
}
```

#### Delete Event
```json
{
  "action": "delete",
  "eventId": "abc123"
}
```

**Response**:
```json
{
  "success": true,
  "action": "create" | "update" | "delete",
  "event": { ... } // null for delete
}
```

---

### 🔄 POST `/gcal-sync` - Trigger Sync

**Body**:
```json
{
  "calendarId": "primary", // optional
  "fullSync": false // true for full, false for incremental
}
```

**Response**:
```json
{
  "success": true,
  "syncType": "full" | "incremental",
  "eventsProcessed": 5
}
```

---

### 🔔 POST `/gcal-webhook` - Webhook Handler

**Headers** (sent by Google):
- `X-Goog-Channel-Id`
- `X-Goog-Channel-Token`
- `X-Goog-Resource-State`

**Response**:
```json
{
  "success": true,
  "syncResult": { ... }
}
```

---

## Event Schema

### Timed Event
```json
{
  "summary": "Meeting",
  "description": "Optional description",
  "location": "Office",
  "start": {
    "dateTime": "2026-02-10T14:00:00",
    "timeZone": "America/New_York"
  },
  "end": {
    "dateTime": "2026-02-10T15:00:00",
    "timeZone": "America/New_York"
  },
  "attendees": [
    { "email": "user@example.com" }
  ],
  "colorId": "9"
}
```

### All-Day Event
```json
{
  "summary": "Holiday",
  "start": { "date": "2026-02-20" },
  "end": { "date": "2026-02-21" }
}
```

---

## Environment Variables

### Supabase Edge Functions
```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Testing Commands

### Fetch Events
```bash
curl "https://your-project.supabase.co/functions/v1/gcal-events?start=2026-02-01&end=2026-02-28"
```

### Create Event
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/gcal-event-mutate" \
  -H "Content-Type: application/json" \
  -d '{"action":"create","event":{"summary":"Test","start":{"date":"2026-02-10"},"end":{"date":"2026-02-11"}}}'
```

### Trigger Sync
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/gcal-sync" \
  -H "Content-Type: application/json" \
  -d '{"fullSync":false}'
```

---

## Error Responses

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Errors**:
- `400`: Missing/invalid parameters
- `403`: Invalid OAuth token
- `404`: Event not found
- `410`: Sync token invalid (auto-handled)
- `500`: Server error

---

## Frontend Usage

### Fetch Events
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/gcal-events?start=${start}&end=${end}`
);
const { events } = await response.json();
```

### Create Event
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create',
    event: { summary: 'New Event', start: {...}, end: {...} }
  })
});
```

### Trigger Sync
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-sync`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fullSync: false })
});
```

---

## Implementation Files

| Endpoint | File | Lines |
|----------|------|-------|
| `/gcal-events` | `supabase/functions/gcal-events/index.ts` | 191 |
| `/gcal-event-mutate` | `supabase/functions/gcal-event-mutate/index.ts` | 262 |
| `/gcal-sync` | `supabase/functions/gcal-sync/index.ts` | 342 |
| `/gcal-webhook` | `supabase/functions/gcal-webhook/index.ts` | 98 |

**Total**: 893 lines of production-ready code ✅

---

## Status: ✅ COMPLETE

All endpoints implemented and operational!
