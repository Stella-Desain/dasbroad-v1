import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDatabase() {
    console.log('🗑️  Clearing Google Calendar database...\n');

    try {
        // 1. Delete all cached events
        console.log('1️⃣  Deleting cached events...');
        const { error: eventsError } = await supabase
            .from('gcal_events_cache')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (eventsError) {
            console.error('   ❌ Error:', eventsError.message);
        } else {
            console.log('   ✅ Cached events deleted');
        }

        // 2. Delete all watch channels
        console.log('2️⃣  Deleting watch channels...');
        const { error: watchError } = await supabase
            .from('gcal_watch_channels')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (watchError) {
            console.error('   ❌ Error:', watchError.message);
        } else {
            console.log('   ✅ Watch channels deleted');
        }

        // 3. Delete sync state
        console.log('3️⃣  Deleting sync state...');
        const { error: syncError } = await supabase
            .from('gcal_sync_state')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (syncError) {
            console.error('   ❌ Error:', syncError.message);
        } else {
            console.log('   ✅ Sync state deleted');
        }

        // 4. Delete OAuth tokens
        console.log('4️⃣  Deleting OAuth tokens...');
        const { error: tokenError } = await supabase
            .from('google_oauth_tokens')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (tokenError) {
            console.error('   ❌ Error:', tokenError.message);
        } else {
            console.log('   ✅ OAuth tokens deleted');
        }

        // Verify all tables are empty
        console.log('\n📊 Verifying tables are empty...\n');

        const tables = [
            'gcal_events_cache',
            'gcal_watch_channels',
            'gcal_sync_state',
            'google_oauth_tokens'
        ];

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`   ${table}: ❌ Error - ${error.message}`);
            } else {
                console.log(`   ${table}: ${count === 0 ? '✅' : '⚠️'} ${count} rows`);
            }
        }

        console.log('\n✅ Database cleared successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Logout from the app');
        console.log('   2. Sign in with Google');
        console.log('   3. Authorize Calendar access');
        console.log('   4. Verify tokens are synced');

    } catch (error) {
        console.error('\n❌ Error clearing database:', error);
        process.exit(1);
    }
}

clearDatabase();
