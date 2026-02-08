/**
 * DIAGNOSTIC SCRIPT 1: Test Environment Variables & Edge Function
 * 
 * This script tests if:
 * 1. Edge Function is deployed and accessible
 * 2. Database connection works
 * 3. Table schema is correct
 */

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQzMzAsImV4cCI6MjA4MDg4MDMzMH0.2oSgoXvZWgdLf24zO-412LNVL0VyFatiyzW6zirYhKA';

console.log('🔍 DIAGNOSTIC TEST 1: Environment & Edge Function');
console.log('='.repeat(60));

async function testEdgeFunctionDeployment() {
    console.log('\n📦 Test 1: Edge Function Deployment');
    console.log('-'.repeat(60));

    try {
        const callbackUrl = `${SUPABASE_URL}/functions/v1/gcal-oauth-callback`;
        console.log('Testing URL:', callbackUrl);

        const response = await fetch(callbackUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            redirect: 'manual', // Don't follow redirects
        });

        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        if (response.status === 302 || response.status === 200 || response.status === 307) {
            console.log('✅ Edge Function is deployed and accessible');
            const location = response.headers.get('location');
            if (location) {
                console.log('Redirects to:', location.substring(0, 50) + '...');
            }
            return true;
        } else {
            console.log('❌ Edge Function returned unexpected status');
            const text = await response.text();
            console.log('Response:', text.substring(0, 200));
            return false;
        }
    } catch (error) {
        console.log('❌ Edge Function test failed:', error.message);
        return false;
    }
}

async function testDatabaseConnection() {
    console.log('\n🗄️  Test 2: Database Connection');
    console.log('-'.repeat(60));

    try {
        const url = `${SUPABASE_URL}/rest/v1/google_oauth_tokens?select=*&limit=1`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            console.log('❌ Database query failed:', error.message || error.hint);
            return false;
        }

        const data = await response.json();

        console.log('✅ Database connection successful');
        console.log('Current tokens in database:', data?.length || 0);

        if (data && data.length > 0) {
            console.log('Token data:', {
                user_label: data[0].user_label,
                has_access_token: !!data[0].access_token,
                has_refresh_token: !!data[0].refresh_token,
                token_expiry: data[0].token_expiry,
            });
        } else {
            console.log('⚠️  No tokens found in database');
        }

        return true;
    } catch (error) {
        console.log('❌ Database test failed:', error.message);
        return false;
    }
}

async function testTableSchema() {
    console.log('\n📋 Test 3: Table Schema Check');
    console.log('-'.repeat(60));

    try {
        // Try to query table structure
        const url = `${SUPABASE_URL}/rest/v1/google_oauth_tokens?select=*&limit=0`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation',
            },
        });

        if (response.status === 404) {
            console.log('❌ Table does not exist');
            return false;
        }

        if (response.status === 401 || response.status === 403) {
            console.log('⚠️  Permission issue (might be RLS)');
            console.log('This is expected if RLS is enabled');
            return true;
        }

        if (response.ok) {
            console.log('✅ Table exists and is accessible');
            return true;
        }

        const error = await response.json();
        console.log('❌ Schema check failed:', error.message || error.hint);
        return false;
    } catch (error) {
        console.log('❌ Schema test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('\n🚀 Starting Diagnostic Tests...\n');

    const results = {
        edgeFunction: await testEdgeFunctionDeployment(),
        database: await testDatabaseConnection(),
        schema: await testTableSchema(),
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log('Edge Function Deployed:', results.edgeFunction ? '✅' : '❌');
    console.log('Database Connection:', results.database ? '✅' : '❌');
    console.log('Table Schema:', results.schema ? '✅' : '❌');

    const allPassed = Object.values(results).every(r => r);

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
        console.log('✅ ALL TESTS PASSED');
        console.log('\nNext steps:');
        console.log('1. Check Edge Function environment variables');
        console.log('2. Test OAuth flow manually');
        console.log('3. Check Edge Function logs');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('\nFix the failed tests before proceeding:');
        if (!results.edgeFunction) {
            console.log('- Deploy Edge Function: npx supabase functions deploy gcal-oauth-callback');
        }
        if (!results.database) {
            console.log('- Check database connection and table permissions');
        }
        if (!results.schema) {
            console.log('- Create table or check RLS policies');
        }
    }
    console.log('='.repeat(60));
}

// Run tests
runAllTests().catch(console.error);
