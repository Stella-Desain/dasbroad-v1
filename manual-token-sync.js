// Manual Token Sync Test
// Run this in browser console after logging in with Google

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjY0NjYsImV4cCI6MjA1MzU0MjQ2Nn0.Uw-OMbFCPDDMOGPVnpZMqhHxVVZRIaZPvPRHwBgJdGk';

async function manualTokenSync() {
    console.log('🔄 Starting manual token sync...');

    try {
        // Get current session
        const sessionResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${localStorage.getItem('sb-oreoepyofghsmvvsxndh-auth-token') ? JSON.parse(localStorage.getItem('sb-oreoepyofghsmvvsxndh-auth-token')).access_token : ''}`
            }
        });

        const session = await sessionResponse.json();
        console.log('📝 Session:', session);

        // Check if user has provider tokens
        const providerToken = session.user?.user_metadata?.provider_token;
        const providerRefreshToken = session.user?.user_metadata?.provider_refresh_token;

        console.log('🔑 Provider Token:', providerToken ? 'Found' : 'Not found');
        console.log('🔑 Refresh Token:', providerRefreshToken ? 'Found' : 'Not found');

        if (!providerToken || !providerRefreshToken) {
            console.error('❌ No provider tokens found in session!');
            console.log('💡 This means Supabase Auth did not store Google OAuth tokens.');
            console.log('💡 Check Supabase Auth configuration:');
            console.log('   1. Google provider enabled?');
            console.log('   2. Calendar scope added?');
            console.log('   3. access_type=offline in OAuth request?');
            return;
        }

        // Manual insert to database
        console.log('💾 Saving tokens to database...');

        const tokenExpiry = new Date(Date.now() + 3600000).toISOString();

        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/google_oauth_tokens`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('sb-oreoepyofghsmvvsxndh-auth-token')).access_token}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                user_label: 'default',
                access_token: providerToken,
                refresh_token: providerRefreshToken,
                token_expiry: tokenExpiry,
                scopes: 'https://www.googleapis.com/auth/calendar'
            })
        });

        if (!insertResponse.ok) {
            const error = await insertResponse.text();
            console.error('❌ Failed to save tokens:', error);
            return;
        }

        const result = await insertResponse.json();
        console.log('✅ Tokens saved successfully!', result);

        // Verify
        const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/google_oauth_tokens?user_label=eq.default`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${JSON.parse(localStorage.getItem('sb-oreoepyofghsmvvsxndh-auth-token')).access_token}`
            }
        });

        const tokens = await verifyResponse.json();
        console.log('✅ Verification:', tokens);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the sync
manualTokenSync();
