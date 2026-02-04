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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/functions/v1/gcal-oauth-callback`;

    // Handle error from Google
    if (error) {
      console.error('OAuth error from Google:', error);
      return new Response(
        `<html><body><h1>Authorization Failed</h1><p>${error}</p><script>window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // If no code, redirect to Google OAuth
    if (!code) {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      if (!clientId) {
        throw new Error('GOOGLE_CLIENT_ID not configured');
      }

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token

      return Response.redirect(authUrl.toString(), 302);
    }

    // Exchange code for tokens
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
    }

    console.log('Exchanging authorization code for tokens...');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    if (!tokenData.refresh_token) {
      throw new Error('No refresh token received. Please revoke access and try again.');
    }

    // Store tokens in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    const { error: upsertError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_label: 'default',
        refresh_token: tokenData.refresh_token,
        access_token: tokenData.access_token,
        token_expiry: tokenExpiry.toISOString(),
        scopes: tokenData.scope || 'https://www.googleapis.com/auth/calendar',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_label' });

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      throw upsertError;
    }

    console.log('Tokens stored successfully');

    // Trigger initial full sync
    console.log('Triggering initial full sync...');
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/gcal-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ fullSync: true }),
    });

    const syncResult = await syncResponse.json();
    console.log('Initial sync result:', syncResult);

    // Return success page
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Google Calendar Connected</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .card {
      background: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    h1 { color: #22c55e; margin-bottom: 0.5rem; }
    p { color: #666; }
    .checkmark { font-size: 48px; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="checkmark">✓</div>
    <h1>Connected!</h1>
    <p>Your Google Calendar is now connected.</p>
    <p>Initial sync: ${syncResult.eventsProcessed || 0} events imported.</p>
    <p>You can close this window.</p>
    <script>
      setTimeout(() => {
        if (window.opener) {
          window.opener.postMessage({ type: 'GCAL_OAUTH_SUCCESS' }, '*');
        }
        window.close();
      }, 2000);
    </script>
  </div>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    .card {
      background: white;
      padding: 2rem 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
      max-width: 400px;
    }
    h1 { color: #ef4444; margin-bottom: 0.5rem; }
    p { color: #666; }
    .error { font-size: 48px; margin-bottom: 1rem; }
    .details { font-size: 12px; color: #999; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card">
    <div class="error">✗</div>
    <h1>Connection Failed</h1>
    <p>Could not connect to Google Calendar.</p>
    <p class="details">${errorMessage}</p>
  </div>
</body>
</html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
});
