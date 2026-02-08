/**
 * Call check-secrets Edge Function
 */

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQzMzAsImV4cCI6MjA4MDg4MDMzMH0.2oSgoXvZWgdLf24zO-412LNVL0VyFatiyzW6zirYhKA';

async function checkSecrets() {
    console.log('🔍 Checking Supabase Edge Function Secrets');
    console.log('='.repeat(60));
    console.log(`Calling: ${SUPABASE_URL}/functions/v1/check-secrets\n`);

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/check-secrets`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });

        if (!response.ok) {
            console.log(`❌ Function call failed`);
            console.log(`Status: ${response.status}`);
            const text = await response.text();
            console.log(`Response: ${text}`);
            return;
        }

        const data = await response.json();

        console.log('✅ Function called successfully\n');
        console.log('📋 Secrets Status:');
        console.log('='.repeat(60));

        // Google Client ID
        console.log('\n🔑 GOOGLE_CLIENT_ID:');
        if (data.secrets.GOOGLE_CLIENT_ID.exists) {
            console.log(`  ✅ EXISTS`);
            console.log(`  Length: ${data.secrets.GOOGLE_CLIENT_ID.length} characters`);
            console.log(`  Preview: ${data.secrets.GOOGLE_CLIENT_ID.preview}`);
            console.log(`  Format: ${data.secrets.GOOGLE_CLIENT_ID.endsWithCorrectFormat ? '✅ Valid (.apps.googleusercontent.com)' : '❌ Invalid format'}`);
        } else {
            console.log(`  ❌ NOT SET`);
        }

        // Google Client Secret
        console.log('\n🔐 GOOGLE_CLIENT_SECRET:');
        if (data.secrets.GOOGLE_CLIENT_SECRET.exists) {
            console.log(`  ✅ EXISTS`);
            console.log(`  Length: ${data.secrets.GOOGLE_CLIENT_SECRET.length} characters`);
            console.log(`  Preview: ${data.secrets.GOOGLE_CLIENT_SECRET.preview}`);
        } else {
            console.log(`  ❌ NOT SET`);
        }

        // Supabase URL
        console.log('\n🌐 SUPABASE_URL:');
        if (data.secrets.SUPABASE_URL.exists) {
            console.log(`  ✅ EXISTS`);
            console.log(`  Value: ${data.secrets.SUPABASE_URL.value}`);
            console.log(`  Protocol: ${data.secrets.SUPABASE_URL.isHTTPS ? '✅ HTTPS' : '❌ HTTP'}`);
        } else {
            console.log(`  ❌ NOT SET`);
        }

        // Service Role Key
        console.log('\n🔑 SUPABASE_SERVICE_ROLE_KEY:');
        if (data.secrets.SUPABASE_SERVICE_ROLE_KEY.exists) {
            console.log(`  ✅ EXISTS`);
            console.log(`  Length: ${data.secrets.SUPABASE_SERVICE_ROLE_KEY.length} characters`);
        } else {
            console.log(`  ❌ NOT SET`);
        }

        console.log('\n' + '='.repeat(60));
        console.log(`Timestamp: ${data.timestamp}`);
        console.log('='.repeat(60));

        // Summary
        const allSet = data.secrets.GOOGLE_CLIENT_ID.exists &&
            data.secrets.GOOGLE_CLIENT_SECRET.exists &&
            data.secrets.SUPABASE_URL.exists &&
            data.secrets.SUPABASE_SERVICE_ROLE_KEY.exists;

        if (allSet) {
            console.log('\n✅ All required secrets are set!');

            if (!data.secrets.SUPABASE_URL.isHTTPS) {
                console.log('\n⚠️  WARNING: SUPABASE_URL is using HTTP instead of HTTPS!');
                console.log('   This could be causing the redirect_uri_mismatch error.');
            }

            if (!data.secrets.GOOGLE_CLIENT_ID.endsWithCorrectFormat) {
                console.log('\n⚠️  WARNING: GOOGLE_CLIENT_ID format looks incorrect!');
                console.log('   Should end with .apps.googleusercontent.com');
            }
        } else {
            console.log('\n❌ Some secrets are missing!');
            console.log('   Set them with: npx supabase secrets set KEY=value');
        }

    } catch (error) {
        console.error('❌ Error calling function:', error.message);
    }
}

checkSecrets();
