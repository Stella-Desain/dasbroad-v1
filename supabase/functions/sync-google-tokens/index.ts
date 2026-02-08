/**
 * Sync Google OAuth Tokens from Supabase Auth to google_oauth_tokens table
 * This function is triggered after successful OAuth login
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get user's auth session
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const supabaseUrl = 'https://oreoepyofghsmvvsxndh.supabase.co';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the user from the auth header
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Failed to get user');
        }

        // Get provider token from auth.identities
        const googleIdentity = user.identities?.find(id => id.provider === 'google');
        if (!googleIdentity) {
            throw new Error('No Google identity found');
        }

        // Extract tokens from identity_data
        const providerToken = googleIdentity.identity_data?.provider_token;
        const providerRefreshToken = googleIdentity.identity_data?.provider_refresh_token;
        const expiresAt = googleIdentity.identity_data?.expires_at;

        if (!providerToken) {
            throw new Error('No provider token found');
        }

        // Calculate token expiry
        const tokenExpiry = expiresAt
            ? new Date(expiresAt * 1000).toISOString()
            : new Date(Date.now() + 3600 * 1000).toISOString();

        // Upsert tokens to google_oauth_tokens table
        const { error: upsertError } = await supabase
            .from('google_oauth_tokens')
            .upsert({
                user_label: 'default',
                refresh_token: providerRefreshToken || null,
                access_token: providerToken,
                token_expiry: tokenExpiry,
                scopes: 'https://www.googleapis.com/auth/calendar',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_label' });

        if (upsertError) {
            console.error('Failed to upsert tokens:', upsertError);
            throw upsertError;
        }

        console.log('✅ Tokens synced successfully');

        // Trigger initial sync
        console.log('Triggering initial full sync...');
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ syncType: 'full' }),
        });

        if (!syncResponse.ok) {
            console.error('Sync trigger failed:', await syncResponse.text());
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Tokens synced and initial sync triggered',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );

    } catch (error) {
        console.error('Error syncing tokens:', error);
        return new Response(
            JSON.stringify({
                error: error.message,
                success: false,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
