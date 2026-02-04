import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-channel-expiration, x-goog-resource-id, x-goog-resource-uri, x-goog-resource-state, x-goog-message-number',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract Google webhook headers
    const channelId = req.headers.get('x-goog-channel-id');
    const channelToken = req.headers.get('x-goog-channel-token');
    const resourceState = req.headers.get('x-goog-resource-state');
    const resourceId = req.headers.get('x-goog-resource-id');

    console.log('Webhook received:', {
      channelId,
      resourceState,
      resourceId,
    });

    // Handle sync verification (Google sends this to verify the endpoint)
    if (resourceState === 'sync') {
      console.log('Sync verification received');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Validate the channel token
    if (!channelId || !channelToken) {
      console.error('Missing channel ID or token');
      return new Response('Invalid request', { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the channel exists and token matches
    const { data: channel, error: channelError } = await supabase
      .from('gcal_watch_channels')
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (channelError || !channel) {
      console.error('Channel not found:', channelId);
      return new Response('Channel not found', { status: 404, headers: corsHeaders });
    }

    if (channel.channel_token !== channelToken) {
      console.error('Invalid channel token');
      return new Response('Invalid token', { status: 403, headers: corsHeaders });
    }

    // Trigger incremental sync
    console.log('Triggering incremental sync for calendar:', channel.calendar_id);
    
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        calendarId: channel.calendar_id,
        fullSync: false,
      }),
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.error('Sync failed:', errorText);
      return new Response('Sync failed', { status: 500, headers: corsHeaders });
    }

    const syncResult = await syncResponse.json();
    console.log('Sync completed:', syncResult);

    return new Response(
      JSON.stringify({ success: true, syncResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
