/**
 * Verify Supabase Edge Function Secrets
 * This creates a diagnostic endpoint to check secrets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const secrets = {
            GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID'),
            GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET'),
            SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
            SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        };

        const result = {
            timestamp: new Date().toISOString(),
            secrets: {
                GOOGLE_CLIENT_ID: {
                    exists: !!secrets.GOOGLE_CLIENT_ID,
                    length: secrets.GOOGLE_CLIENT_ID?.length || 0,
                    preview: secrets.GOOGLE_CLIENT_ID
                        ? secrets.GOOGLE_CLIENT_ID.substring(0, 20) + '...'
                        : 'NOT SET',
                    endsWithCorrectFormat: secrets.GOOGLE_CLIENT_ID?.endsWith('.apps.googleusercontent.com') || false,
                },
                GOOGLE_CLIENT_SECRET: {
                    exists: !!secrets.GOOGLE_CLIENT_SECRET,
                    length: secrets.GOOGLE_CLIENT_SECRET?.length || 0,
                    preview: secrets.GOOGLE_CLIENT_SECRET
                        ? secrets.GOOGLE_CLIENT_SECRET.substring(0, 10) + '***'
                        : 'NOT SET',
                },
                SUPABASE_URL: {
                    exists: !!secrets.SUPABASE_URL,
                    value: secrets.SUPABASE_URL || 'NOT SET',
                    isHTTPS: secrets.SUPABASE_URL?.startsWith('https://') || false,
                },
                SUPABASE_SERVICE_ROLE_KEY: {
                    exists: !!secrets.SUPABASE_SERVICE_ROLE_KEY,
                    length: secrets.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
                },
            },
        };

        return new Response(JSON.stringify(result, null, 2), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
