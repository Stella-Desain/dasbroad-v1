import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// deno-lint-ignore no-explicit-any
async function stopWatchChannel(accessToken: string, channelId: string, resourceId: string): Promise<boolean> {
  try {
    const stopResponse = await fetch('https://www.googleapis.com/calendar/v3/channels/stop', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        resourceId: resourceId,
      }),
    });

    if (stopResponse.ok || stopResponse.status === 404) {
      // 404 means channel already expired/stopped, which is fine
      console.log(`Channel ${channelId} stopped successfully (or already expired)`);
      return true;
    }

    const errorText = await stopResponse.text();
    console.warn(`Failed to stop channel ${channelId}: ${errorText}`);
    return false;
  } catch (error) {
    console.warn(`Error stopping channel ${channelId}:`, error);
    return false;
  }
}

// deno-lint-ignore no-explicit-any
async function createNewWatchChannel(supabase: any, accessToken: string, calendarId: string): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  
  const channelId = crypto.randomUUID();
  const channelToken = crypto.randomUUID();
  const webhookUrl = `${supabaseUrl}/functions/v1/gcal-webhook`;

  console.log(`Creating new watch channel for calendar: ${calendarId}`);

  const watchResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token: channelToken,
      }),
    }
  );

  if (!watchResponse.ok) {
    const errorText = await watchResponse.text();
    throw new Error(`Failed to create watch channel: ${errorText}`);
  }

  const watchData = await watchResponse.json();
  console.log('New watch channel created:', watchData);

  const expirationMs = parseInt(watchData.expiration, 10);
  const expirationAt = new Date(expirationMs);

  // Upsert channel info
  const { error: upsertError } = await supabase
    .from('gcal_watch_channels')
    .upsert({
      calendar_id: calendarId,
      channel_id: watchData.id,
      resource_id: watchData.resourceId,
      channel_token: channelToken,
      expiration_ms: expirationMs,
      expiration_at: expirationAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'calendar_id' });

  if (upsertError) {
    throw upsertError;
  }

  return {
    channelId: watchData.id,
    resourceId: watchData.resourceId,
    expiresAt: expirationAt.toISOString(),
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

    // Check for channels expiring within the next 24 hours
    const renewThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log(`Checking for channels expiring before: ${renewThreshold.toISOString()}`);

    const { data: expiringChannels, error: queryError } = await supabase
      .from('gcal_watch_channels')
      .select('*')
      .lt('expiration_at', renewThreshold.toISOString());

    if (queryError) {
      throw queryError;
    }

    if (!expiringChannels || expiringChannels.length === 0) {
      console.log('No channels need renewal');
      return new Response(
        JSON.stringify({ success: true, message: 'No channels need renewal', renewed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiringChannels.length} channel(s) to renew`);

    // Get access token once for all operations
    const accessToken = await getValidAccessToken(supabase);

    const results = [];

    for (const channel of expiringChannels) {
      try {
        // Stop old channel (best effort)
        await stopWatchChannel(accessToken, channel.channel_id, channel.resource_id);

        // Create new channel
        const newChannel = await createNewWatchChannel(supabase, accessToken, channel.calendar_id);
        
        results.push({
          calendarId: channel.calendar_id,
          success: true,
          newChannelId: newChannel.channelId,
          expiresAt: newChannel.expiresAt,
        });

        console.log(`Renewed channel for calendar: ${channel.calendar_id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to renew channel for calendar ${channel.calendar_id}:`, errorMessage);
        
        results.push({
          calendarId: channel.calendar_id,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Renewed ${successCount}/${expiringChannels.length} channels`,
        renewed: successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Renewal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
