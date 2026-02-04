import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleEvent {
  id: string;
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { date?: string; dateTime?: string; timeZone?: string };
  organizer?: { email?: string; displayName?: string; self?: boolean };
  creator?: { email?: string; displayName?: string; self?: boolean };
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
  visibility?: string;
  transparency?: string;
  iCalUID?: string;
  sequence?: number;
  eventType?: string;
  hangoutLink?: string;
  conferenceData?: Record<string, unknown>;
  attachments?: Array<Record<string, unknown>>;
  extendedProperties?: Record<string, unknown>;
}

// deno-lint-ignore no-explicit-any
async function getValidAccessToken(supabase: any): Promise<string> {
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_label', 'default')
    .single();

  if (tokenError || !tokenData) {
    throw new Error('No OAuth tokens found. Please complete OAuth setup first.');
  }

  // deno-lint-ignore no-explicit-any
  const token = tokenData as any;

  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiry = token.token_expiry ? new Date(token.token_expiry) : null;
  
  if (token.access_token && expiry && expiry > new Date(now.getTime() + 5 * 60 * 1000)) {
    return token.access_token;
  }

  // Refresh the token
  console.log('Refreshing access token...');
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
  }

  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  const refreshData = await refreshResponse.json();
  const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000);

  // Update token in database
  await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: refreshData.access_token,
      token_expiry: newExpiry.toISOString(),
    })
    .eq('user_label', 'default');

  return refreshData.access_token;
}

async function fetchEventsPage(
  accessToken: string,
  calendarId: string,
  syncToken?: string,
  pageToken?: string
): Promise<{ events: GoogleEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  
  if (syncToken) {
    url.searchParams.set('syncToken', syncToken);
  } else {
    // Full sync - get events from past year to future year
    const timeMin = new Date();
    timeMin.setFullYear(timeMin.getFullYear() - 1);
    url.searchParams.set('timeMin', timeMin.toISOString());
    url.searchParams.set('singleEvents', 'false'); // Include recurring event definitions
  }
  
  url.searchParams.set('maxResults', '250');
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Check for sync token invalidation (410 Gone)
    if (response.status === 410) {
      throw new Error('SYNC_TOKEN_INVALID');
    }
    throw new Error(`Google Calendar API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    events: data.items || [],
    nextPageToken: data.nextPageToken,
    nextSyncToken: data.nextSyncToken,
  };
}

function mapEventToCache(event: GoogleEvent, calendarId: string) {
  return {
    calendar_id: calendarId,
    event_id: event.id,
    status: event.status || null,
    html_link: event.htmlLink || null,
    created: event.created || null,
    updated: event.updated || null,
    summary: event.summary || null,
    description: event.description || null,
    location: event.location || null,
    color_id: event.colorId || null,
    start_json: event.start,
    end_json: event.end,
    recurrence: event.recurrence || null,
    recurring_event_id: event.recurringEventId || null,
    original_start_time: event.originalStartTime || null,
    organizer_json: event.organizer || null,
    creator_json: event.creator || null,
    attendees_json: event.attendees || null,
    reminders_json: event.reminders || null,
    visibility: event.visibility || null,
    transparency: event.transparency || null,
    ical_uid: event.iCalUID || null,
    sequence: event.sequence || 0,
    event_type: event.eventType || null,
    hangout_link: event.hangoutLink || null,
    conference_data_json: event.conferenceData || null,
    attachments_json: event.attachments || null,
    extended_properties_json: event.extendedProperties || null,
    raw_event_json: event,
    deleted: event.status === 'cancelled',
    last_synced_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const calendarId = body.calendarId || 'primary';
    const fullSync = body.fullSync === true;

    console.log(`Starting ${fullSync ? 'full' : 'incremental'} sync for calendar: ${calendarId}`);

    // Update sync state to syncing
    await supabase
      .from('gcal_sync_state')
      .upsert({
        calendar_id: calendarId,
        status: 'syncing',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'calendar_id' });

    // Get access token
    const accessToken = await getValidAccessToken(supabase);

    // Get current sync token if not full sync
    let syncToken: string | undefined;
    if (!fullSync) {
      const { data: syncState } = await supabase
        .from('gcal_sync_state')
        .select('next_sync_token')
        .eq('calendar_id', calendarId)
        .single();
      
      syncToken = syncState?.next_sync_token || undefined;
    }

    // If we have no sync token, do a full sync
    const isFullSync = fullSync || !syncToken;
    
    // Clear cache for full sync
    if (isFullSync) {
      console.log('Performing full sync - clearing existing cache');
      await supabase
        .from('gcal_events_cache')
        .delete()
        .eq('calendar_id', calendarId);
    }

    // Fetch all events (paginated)
    let allEvents: GoogleEvent[] = [];
    let pageToken: string | undefined;
    let newSyncToken: string | undefined;

    try {
      do {
        const page = await fetchEventsPage(accessToken, calendarId, isFullSync ? undefined : syncToken, pageToken);
        allEvents = allEvents.concat(page.events);
        pageToken = page.nextPageToken;
        newSyncToken = page.nextSyncToken;
      } while (pageToken);
    } catch (error) {
      if (error instanceof Error && error.message === 'SYNC_TOKEN_INVALID') {
        console.log('Sync token invalid, performing full sync');
        // Recursive call with fullSync
        const retryResponse = await fetch(req.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarId, fullSync: true }),
        });
        return retryResponse;
      }
      throw error;
    }

    console.log(`Fetched ${allEvents.length} events`);

    // Upsert events to cache
    if (allEvents.length > 0) {
      const cacheRecords = allEvents.map(event => mapEventToCache(event, calendarId));
      
      // Batch upsert in chunks of 100
      for (let i = 0; i < cacheRecords.length; i += 100) {
        const chunk = cacheRecords.slice(i, i + 100);
        const { error: upsertError } = await supabase
          .from('gcal_events_cache')
          .upsert(chunk, { onConflict: 'calendar_id,event_id' });
        
        if (upsertError) {
          console.error('Error upserting events:', upsertError);
          throw upsertError;
        }
      }
    }

    // Update sync state
    const syncUpdate: Record<string, unknown> = {
      calendar_id: calendarId,
      status: 'idle',
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    if (newSyncToken) {
      syncUpdate.next_sync_token = newSyncToken;
    }

    if (isFullSync) {
      syncUpdate.last_full_sync_at = new Date().toISOString();
    } else {
      syncUpdate.last_incremental_sync_at = new Date().toISOString();
    }

    await supabase
      .from('gcal_sync_state')
      .upsert(syncUpdate, { onConflict: 'calendar_id' });

    console.log('Sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        syncType: isFullSync ? 'full' : 'incremental',
        eventsProcessed: allEvents.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Try to update sync state with error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase
        .from('gcal_sync_state')
        .upsert({
          calendar_id: 'primary',
          status: 'error',
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'calendar_id' });
    } catch {
      // Ignore error state update failures
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
