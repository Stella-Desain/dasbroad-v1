import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing authorization header');
        }

        // Get user from JWT
        const { data: { user }, error: userError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (userError || !user) {
            throw new Error('Invalid user token');
        }

        // Get user's session to extract provider tokens
        const { data: sessionData, error: sessionError } = await supabase.auth.admin.getUserById(user.id);

        if (sessionError || !sessionData) {
            throw new Error('Failed to get user session');
        }

        // Extract Google OAuth tokens from user metadata
        const providerToken = sessionData.user.user_metadata?.provider_token;
        const providerRefreshToken = sessionData.user.user_metadata?.provider_refresh_token;

        if (!providerToken || !providerRefreshToken) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'No Google OAuth tokens found. Please re-login with Google.',
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Calculate token expiry (Google tokens expire in 1 hour)
        const tokenExpiry = new Date(Date.now() + 3600000).toISOString();

        // Save tokens to google_oauth_tokens table
        const { error: upsertError } = await supabase
            .from('google_oauth_tokens')
            .upsert({
                user_label: 'default',
                access_token: providerToken,
                refresh_token: providerRefreshToken,
                token_expiry: tokenExpiry,
                scopes: 'https://www.googleapis.com/auth/calendar',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_label',
            });

        if (upsertError) {
            console.error('Failed to save tokens:', upsertError);
            throw new Error('Failed to save OAuth tokens');
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Google Calendar tokens synced successfully',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in sync-google-tokens:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
