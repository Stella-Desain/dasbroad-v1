// Clear Google Calendar Database
// Run with: node clear-database-simple.js

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NjY0NjYsImV4cCI6MjA1MzU0MjQ2Nn0.Uw-OMbFCPDDMOGPVnpZMqhHxVVZRIaZPvPRHwBgJdGk';

async function deleteFromTable(tableName) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?id=neq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete from ${tableName}: ${error}`);
    }

    return response;
}

async function getCount(tableName) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count`, {
        method: 'HEAD',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact'
        }
    });

    const count = response.headers.get('content-range')?.split('/')[1] || '0';
    return parseInt(count);
}

async function clearDatabase() {
    console.log('🗑️  Clearing Google Calendar database...\n');

    const tables = [
        'gcal_events_cache',
        'gcal_watch_channels',
        'gcal_sync_state',
        'google_oauth_tokens'
    ];

    // Delete from all tables
    for (const table of tables) {
        try {
            console.log(`Deleting from ${table}...`);
            await deleteFromTable(table);
            console.log(`✅ ${table} cleared`);
        } catch (error) {
            console.error(`❌ Error clearing ${table}:`, error.message);
        }
    }

    // Verify all tables are empty
    console.log('\n📊 Verifying tables are empty...\n');

    for (const table of tables) {
        try {
            const count = await getCount(table);
            console.log(`   ${table}: ${count === 0 ? '✅' : '⚠️'} ${count} rows`);
        } catch (error) {
            console.log(`   ${table}: ❌ Error - ${error.message}`);
        }
    }

    console.log('\n✅ Database cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Logout from the app');
    console.log('   2. Sign in with Google');
    console.log('   3. Authorize Calendar access');
    console.log('   4. Verify tokens are synced');
}

clearDatabase().catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
});
