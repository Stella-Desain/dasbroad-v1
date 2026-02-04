import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * GET /api/events - Query cached Google Calendar events
 * 
 * Query params:
 *   - start: YYYY-MM-DD (required)
 *   - end: YYYY-MM-DD (required)
 *   - calendarId: string (optional, defaults to 'primary')
 * 
 * Response:
 * {
 *   success: true,
 *   events: [
 *     {
 *       event_id: string,
 *       summary: string | null,
 *       description: string | null,
 *       location: string | null,
 *       start: { date?: string, dateTime?: string, timeZone?: string },
 *       end: { date?: string, dateTime?: string, timeZone?: string },
 *       status: string,
 *       color_id: string | null,
 *       html_link: string | null,
 *       attendees: Array<{ email: string, displayName?: string, responseStatus?: string }> | null,
 *       organizer: { email?: string, displayName?: string, self?: boolean } | null,
 *       recurrence: string[] | null,
 *       updated: string | null,
 *       created: string | null
 *     }
 *   ],
 *   count: number
 * }
 */

interface CachedEvent {
  calendar_id: string;
  event_id: string;
  status: string | null;
  html_link: string | null;
  created: string | null;
  updated: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  color_id: string | null;
  start_json: { date?: string; dateTime?: string; timeZone?: string };
  end_json: { date?: string; dateTime?: string; timeZone?: string };
  recurrence: string[] | null;
  recurring_event_id: string | null;
  original_start_time: Record<string, unknown> | null;
  organizer_json: { email?: string; displayName?: string; self?: boolean } | null;
  creator_json: { email?: string; displayName?: string; self?: boolean } | null;
  attendees_json: Array<{ email: string; displayName?: string; responseStatus?: string }> | null;
  reminders_json: Record<string, unknown> | null;
  visibility: string | null;
  transparency: string | null;
  hangout_link: string | null;
  conference_data_json: Record<string, unknown> | null;
}

function parseEventDate(json: { date?: string; dateTime?: string }): Date | null {
  if (json.dateTime) {
    return new Date(json.dateTime);
  }
  if (json.date) {
    return new Date(json.date + 'T00:00:00Z');
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const calendarId = url.searchParams.get('calendarId') || 'primary';

    if (!startParam || !endParam) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required query parameters: start and end (YYYY-MM-DD format)' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse date range
    const startDate = new Date(startParam + 'T00:00:00Z');
    const endDate = new Date(endParam + 'T23:59:59Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid date format. Use YYYY-MM-DD.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query events from cache
    const { data, error } = await supabase
      .from('gcal_events_cache')
      .select('*')
      .eq('calendar_id', calendarId)
      .eq('deleted', false);

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Filter events by date range (in-memory since JSONB date comparison is complex)
    const events = (data || [])
      .map((row) => row as unknown as CachedEvent)
      .filter((event) => {
        const eventStart = parseEventDate(event.start_json);
        const eventEnd = parseEventDate(event.end_json);
        
        if (!eventStart || !eventEnd) return false;
        
        // Event overlaps with requested range
        return eventEnd >= startDate && eventStart <= endDate;
      })
      .map((event) => ({
        event_id: event.event_id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start_json,
        end: event.end_json,
        status: event.status,
        color_id: event.color_id,
        html_link: event.html_link,
        attendees: event.attendees_json,
        organizer: event.organizer_json,
        recurrence: event.recurrence,
        recurring_event_id: event.recurring_event_id,
        updated: event.updated,
        created: event.created,
        visibility: event.visibility,
        transparency: event.transparency,
        hangout_link: event.hangout_link,
        conference_data: event.conference_data_json,
      }));

    // Sort by start date
    events.sort((a, b) => {
      const aDate = parseEventDate(a.start);
      const bDate = parseEventDate(b.start);
      if (!aDate || !bDate) return 0;
      return aDate.getTime() - bDate.getTime();
    });

    console.log(`Returning ${events.length} events for range ${startParam} to ${endParam}`);

    return new Response(
      JSON.stringify({
        success: true,
        events,
        count: events.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
