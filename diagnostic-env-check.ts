/**
 * DIAGNOSTIC SCRIPT 2: Check Edge Function Environment Variables
 * 
 * This creates a temporary Edge Function to check if env vars are set
 */

// Create this as a temporary Edge Function in Supabase
// Path: supabase/functions/diagnostic-env-check/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Check all required environment variables
        const envVars = {
            GOOGLE_CLIENT_ID: Deno.env.get('GOOGLE_CLIENT_ID'),
            GOOGLE_CLIENT_SECRET: Deno.env.get('GOOGLE_CLIENT_SECRET'),
            SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
            SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        };

        // Don't expose actual values, just check if they exist
        const status = {
            GOOGLE_CLIENT_ID: {
                exists: !!envVars.GOOGLE_CLIENT_ID,
                length: envVars.GOOGLE_CLIENT_ID?.length || 0,
                preview: envVars.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
            },
            GOOGLE_CLIENT_SECRET: {
                exists: !!envVars.GOOGLE_CLIENT_SECRET,
                length: envVars.GOOGLE_CLIENT_SECRET?.length || 0,
                preview: envVars.GOOGLE_CLIENT_SECRET ? '***' : 'NOT SET',
            },
            SUPABASE_URL: {
                exists: !!envVars.SUPABASE_URL,
                value: envVars.SUPABASE_URL,
            },
            SUPABASE_SERVICE_ROLE_KEY: {
                exists: !!envVars.SUPABASE_SERVICE_ROLE_KEY,
                length: envVars.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
                preview: envVars.SUPABASE_SERVICE_ROLE_KEY ? '***' : 'NOT SET',
            },
        };

        const allSet = Object.values(envVars).every(v => !!v);

        return new Response(
            JSON.stringify({
                success: allSet,
                message: allSet ? 'All environment variables are set' : 'Some environment variables are missing',
                variables: status,
            }, null, 2),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            }
        );
    }
});
