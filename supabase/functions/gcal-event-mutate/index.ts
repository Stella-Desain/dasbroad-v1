import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  recurrence?: string[];
  attendees?: Array<{ email: string; displayName?: string }>;
  reminders?: { useDefault: boolean; overrides?: Array<{ method: string; minutes: number }> };
  colorId?: string;
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

  const now = new Date();
  const expiry = token.token_expiry ? new Date(token.token_expiry) : null;
  
  if (token.access_token && expiry && expiry > new Date(now.getTime() + 5 * 60 * 1000)) {
    return token.access_token;
  }

  // Refresh the token
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

  await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: refreshData.access_token,
      token_expiry: newExpiry.toISOString(),
    })
    .eq('user_label', 'default');

  return refreshData.access_token;
}

function mapEventToCache(event: Record<string, unknown>, calendarId: string) {
  return {
    calendar_id: calendarId,
    event_id: event.id as string,
    status: event.status as string || null,
    html_link: event.htmlLink as string || null,
    created: event.created as string || null,
    updated: event.updated as string || null,
    summary: event.summary as string || null,
    description: event.description as string || null,
    location: event.location as string || null,
    color_id: event.colorId as string || null,
    start_json: event.start,
    end_json: event.end,
    recurrence: event.recurrence || null,
    recurring_event_id: event.recurringEventId as string || null,
    original_start_time: event.originalStartTime || null,
    organizer_json: event.organizer || null,
    creator_json: event.creator || null,
    attendees_json: event.attendees || null,
    reminders_json: event.reminders || null,
    visibility: event.visibility as string || null,
    transparency: event.transparency as string || null,
    ical_uid: event.iCalUID as string || null,
    sequence: event.sequence as number || 0,
    event_type: event.eventType as string || null,
    hangout_link: event.hangoutLink as string || null,
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

    const body = await req.json();
    const { action, calendarId = 'primary', eventId, event } = body as {
      action: 'create' | 'update' | 'delete';
      calendarId?: string;
      eventId?: string;
      event?: EventInput;
    };

    console.log(`Event mutation: ${action}`, { calendarId, eventId });

    const accessToken = await getValidAccessToken(supabase);

    let response: Response;
    let resultEvent: Record<string, unknown> | null = null;

    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    switch (action) {
      case 'create': {
        if (!event) {
          throw new Error('Event data required for create action');
        }

        response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create event: ${errorText}`);
        }

        resultEvent = await response.json();
        console.log('Event created:', resultEvent?.id);

        // Update cache
        if (resultEvent) {
          const cacheRecord = mapEventToCache(resultEvent, calendarId);
          await supabase
            .from('gcal_events_cache')
            .upsert(cacheRecord, { onConflict: 'calendar_id,event_id' });
        }
        break;
      }

      case 'update': {
        if (!eventId) {
          throw new Error('Event ID required for update action');
        }
        if (!event) {
          throw new Error('Event data required for update action');
        }

        response = await fetch(`${baseUrl}/${eventId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update event: ${errorText}`);
        }

        resultEvent = await response.json();
        console.log('Event updated:', resultEvent?.id);

        // Update cache
        if (resultEvent) {
          const cacheRecord = mapEventToCache(resultEvent, calendarId);
          await supabase
            .from('gcal_events_cache')
            .upsert(cacheRecord, { onConflict: 'calendar_id,event_id' });
        }
        break;
      }

      case 'delete': {
        if (!eventId) {
          throw new Error('Event ID required for delete action');
        }

        response = await fetch(`${baseUrl}/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text();
          throw new Error(`Failed to delete event: ${errorText}`);
        }

        console.log('Event deleted:', eventId);

        // Update cache (soft delete)
        await supabase
          .from('gcal_events_cache')
          .update({ deleted: true, status: 'cancelled', last_synced_at: new Date().toISOString() })
          .eq('calendar_id', calendarId)
          .eq('event_id', eventId);
        break;
      }

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        event: resultEvent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Event mutation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
