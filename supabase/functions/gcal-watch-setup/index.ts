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

    console.log(`Setting up watch channel for calendar: ${calendarId}`);

    // Get access token
    const accessToken = await getValidAccessToken(supabase);

    // Generate unique channel ID and token
    const channelId = crypto.randomUUID();
    const channelToken = crypto.randomUUID();

    // Webhook URL - this is the gcal-webhook edge function
    const webhookUrl = `${supabaseUrl}/functions/v1/gcal-webhook`;

    console.log('Creating watch channel with webhook URL:', webhookUrl);

    // Create watch channel via Google Calendar API
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
      console.error('Watch channel creation failed:', errorText);
      throw new Error(`Failed to create watch channel: ${errorText}`);
    }

    const watchData = await watchResponse.json();
    console.log('Watch channel created:', watchData);

    // Store channel info in database
    const expirationMs = parseInt(watchData.expiration, 10);
    const expirationAt = new Date(expirationMs);

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
      console.error('Failed to store channel info:', upsertError);
      throw upsertError;
    }

    console.log('Watch channel stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        channelId: watchData.id,
        resourceId: watchData.resourceId,
        expiresAt: expirationAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Watch setup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
