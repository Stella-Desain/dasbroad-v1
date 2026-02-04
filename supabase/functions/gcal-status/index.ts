import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const calendarId = new URL(req.url).searchParams.get('calendarId') || 'primary';

    // Check OAuth connection
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_oauth_tokens')
      .select('id, user_label, scopes, token_expiry, created_at, updated_at')
      .eq('user_label', 'default')
      .maybeSingle();

    const isConnected = !tokenError && !!tokenData;

    // Get sync state
    const { data: syncState } = await supabase
      .from('gcal_sync_state')
      .select('*')
      .eq('calendar_id', calendarId)
      .maybeSingle();

    // Get watch channel status
    const { data: watchChannel } = await supabase
      .from('gcal_watch_channels')
      .select('*')
      .eq('calendar_id', calendarId)
      .maybeSingle();

    // Determine watch status
    let watchStatus: 'none' | 'active' | 'expired' | 'expiring_soon' = 'none';
    if (watchChannel) {
      const now = new Date();
      const expiresAt = new Date(watchChannel.expiration_at);
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (expiresAt < now) {
        watchStatus = 'expired';
      } else if (hoursUntilExpiry < 24) {
        watchStatus = 'expiring_soon';
      } else {
        watchStatus = 'active';
      }
    }

    // Calculate last sync time
    let lastSyncAt: string | null = null;
    if (syncState) {
      if (syncState.last_incremental_sync_at) {
        lastSyncAt = syncState.last_incremental_sync_at;
      } else if (syncState.last_full_sync_at) {
        lastSyncAt = syncState.last_full_sync_at;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        isConnected,
        hasSyncToken: !!syncState?.next_sync_token,
        syncState: syncState ? {
          status: syncState.status,
          lastFullSyncAt: syncState.last_full_sync_at,
          lastIncrementalSyncAt: syncState.last_incremental_sync_at,
          lastSyncAt,
          errorMessage: syncState.error_message,
        } : null,
        watchChannel: watchChannel ? {
          channelId: watchChannel.channel_id,
          resourceId: watchChannel.resource_id,
          expiresAt: watchChannel.expiration_at,
          status: watchStatus,
        } : null,
        watchStatus,
        oauthInfo: isConnected ? {
          connectedAt: tokenData.created_at,
          scopes: tokenData.scopes,
        } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Status check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
