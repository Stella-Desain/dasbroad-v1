// Complete Diagnostic & Fix Script
// Copy-paste this ENTIRE script into browser console

(async () => {
    console.log('🔍 Starting diagnostic...\n');

    // Import Supabase client from the app
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjY0NjYsImV4cCI6MjA1MzU0MjQ2Nn0.Uw-OMbFCPDDMOGPVnpZMqhHxVVZRIaZPvPRHwBgJdGk';

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('❌ Not logged in or session error:', sessionError);
        return;
    }

    console.log('=== DIAGNOSTIC RESULTS ===');
    console.log('✅ Logged in:', !!session);
    console.log('✅ User ID:', session.user.id);
    console.log('✅ Email:', session.user.email);
    console.log('✅ Provider:', session.user.app_metadata?.provider);
    console.log('\n--- Provider Tokens ---');
    console.log('Has provider_token:', !!session.user.user_metadata?.provider_token);
    console.log('Has refresh_token:', !!session.user.user_metadata?.provider_refresh_token);

    const providerToken = session.user.user_metadata?.provider_token;
    const providerRefreshToken = session.user.user_metadata?.provider_refresh_token;

    if (providerToken) {
        console.log('Provider token (first 20 chars):', providerToken.substring(0, 20) + '...');
    }
    if (providerRefreshToken) {
        console.log('Refresh token (first 20 chars):', providerRefreshToken.substring(0, 20) + '...');
    }

    // Check database
    const { data: tokens, error: tokensError } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('user_label', 'default');

    console.log('\n--- Database ---');
    console.log('Tokens in DB:', tokens?.length || 0);

    if (tokensError) {
        console.error('Error querying DB:', tokensError);
    }

    console.log('=========================\n');

    // Attempt fix if needed
    if (!providerToken || !providerRefreshToken) {
        console.error('❌ PROBLEM: No provider tokens in session!');
        console.log('💡 SOLUTION: You need to re-login with Google');
        console.log('   1. Logout from app');
        console.log('   2. Clear browser cache (Ctrl+Shift+Delete)');
        console.log('   3. Login again with Google');
        console.log('   4. Make sure Calendar permission is requested');
        return;
    }

    if (!tokens || tokens.length === 0) {
        console.log('💾 Tokens found in session but not in DB. Attempting to save...');

        const { data, error } = await supabase
            .from('google_oauth_tokens')
            .upsert({
                user_label: 'default',
                access_token: providerToken,
                refresh_token: providerRefreshToken,
                token_expiry: new Date(Date.now() + 3600000).toISOString(),
                scopes: 'https://www.googleapis.com/auth/calendar',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_label'
            });

        if (error) {
            console.error('❌ Failed to save tokens:', error);
        } else {
            console.log('✅ Tokens saved successfully!');
            console.log('🔄 Reloading page...');
            setTimeout(() => location.reload(), 1000);
        }
    } else {
        console.log('✅ ALL GOOD! Tokens are synced!');
        console.log('Token details:', {
            user_label: tokens[0].user_label,
            has_access_token: !!tokens[0].access_token,
            has_refresh_token: !!tokens[0].refresh_token,
            scopes: tokens[0].scopes,
            expires: tokens[0].token_expiry
        });
    }
})();
