/**
 * Check Edge Function Environment Variables
 * 
 * This script calls a diagnostic endpoint to verify env vars are set
 */

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQzMzAsImV4cCI6MjA4MDg4MDMzMH0.2oSgoXvZWgdLf24zO-412LNVL0VyFatiyzW6zirYhKA';

console.log('🔍 Checking Edge Function Environment Variables');
console.log('='.repeat(60));

async function checkEnvVars() {
    try {
        const url = `${SUPABASE_URL}/functions/v1/diagnostic-env-check`;
        console.log('Calling:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });

        if (!response.ok) {
            console.log('\n❌ Function not deployed or error occurred');
            console.log('Status:', response.status);
            const text = await response.text();
            console.log('Response:', text.substring(0, 300));
            console.log('\nTo deploy:');
            console.log('npx supabase functions deploy diagnostic-env-check');
            return;
        }

        const data = await response.json();

        console.log('\n📊 Environment Variables Status:');
        console.log('-'.repeat(60));

        for (const [key, value] of Object.entries(data.variables)) {
            const status = value.exists ? '✅' : '❌';
            console.log(`${status} ${key}:`, value.exists ? 'SET' : 'NOT SET');

            if (value.preview && value.preview !== 'NOT SET') {
                console.log(`   Preview: ${value.preview}`);
            }
            if (value.length) {
                console.log(`   Length: ${value.length} characters`);
            }
            if (value.value) {
                console.log(`   Value: ${value.value}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        if (data.success) {
            console.log('✅ ALL ENVIRONMENT VARIABLES ARE SET');
            console.log('\nNext step: Test OAuth flow manually');
            console.log('URL: https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback');
        } else {
            console.log('❌ SOME ENVIRONMENT VARIABLES ARE MISSING');
            console.log('\nTo set environment variables:');
            console.log('npx supabase secrets set GOOGLE_CLIENT_ID=your_client_id');
            console.log('npx supabase secrets set GOOGLE_CLIENT_SECRET=your_client_secret');
        }
        console.log('='.repeat(60));

    } catch (error) {
        console.log('\n❌ Error:', error.message);
        console.log('\nMake sure diagnostic-env-check function is deployed:');
        console.log('npx supabase functions deploy diagnostic-env-check');
    }
}

checkEnvVars();
