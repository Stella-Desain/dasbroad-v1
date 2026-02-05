#!/usr/bin/env node

/**
 * Google Calendar Integration Test Script
 * 
 * Tests the /gcal-event-mutate endpoint via terminal
 * 
 * Usage:
 *   node test-gcal.js status          - Check connection status
 *   node test-gcal.js create          - Create a test event
 *   node test-gcal.js update <eventId> - Update an event
 *   node test-gcal.js delete <eventId> - Delete an event
 */

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQzMzAsImV4cCI6MjA4MDg4MDMzMH0.2oSgoXvZWgdLf24zO-412LNVL0VyFatiyzW6zirYhKA';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkStatus() {
    log('\n🔍 Checking Google Calendar connection status...', 'cyan');

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-status`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
            },
        });

        const data = await response.json();

        if (data.success) {
            log('\n✅ Connection Status:', 'green');
            log(`   Connected: ${data.isConnected ? '✅ Yes' : '❌ No'}`, data.isConnected ? 'green' : 'red');
            log(`   Has Sync Token: ${data.hasSyncToken ? '✅ Yes' : '❌ No'}`, data.hasSyncToken ? 'green' : 'yellow');
            log(`   Watch Status: ${data.watchStatus}`, 'blue');

            if (data.syncState) {
                log(`\n📊 Sync State:`, 'cyan');
                log(`   Last Full Sync: ${data.syncState.last_full_sync || 'Never'}`);
                log(`   Last Incremental Sync: ${data.syncState.last_incremental_sync || 'Never'}`);
            }

            if (data.watchChannel) {
                log(`\n📡 Watch Channel:`, 'cyan');
                log(`   Channel ID: ${data.watchChannel.channel_id}`);
                log(`   Expires At: ${data.watchChannel.expiration_at}`);
            }
        } else {
            log('❌ Failed to get status', 'red');
            log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
    }
}

async function createEvent() {
    log('\n📝 Creating test event...', 'cyan');

    const testEvent = {
        summary: `Test Event ${new Date().toISOString()}`,
        description: 'Created via terminal test script',
        start: {
            dateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
            timeZone: 'Asia/Jakarta',
        },
        end: {
            dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            timeZone: 'Asia/Jakarta',
        },
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
                action: 'create',
                event: testEvent,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            log('\n✅ Event created successfully!', 'green');
            log(`   Event ID: ${data.event.id}`, 'blue');
            log(`   Summary: ${data.event.summary}`, 'cyan');
            log(`   Start: ${data.event.start.dateTime}`, 'yellow');
            log(`   End: ${data.event.end.dateTime}`, 'yellow');
            log(`\n💡 To update this event, run:`, 'cyan');
            log(`   node test-gcal.js update ${data.event.id}`, 'yellow');
        } else {
            log('❌ Failed to create event', 'red');
            log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
    }
}

async function updateEvent(eventId) {
    if (!eventId) {
        log('❌ Please provide event ID', 'red');
        log('Usage: node test-gcal.js update <eventId>', 'yellow');
        return;
    }

    log(`\n✏️  Updating event ${eventId}...`, 'cyan');

    const updatedEvent = {
        summary: `Updated Test Event ${new Date().toISOString()}`,
        description: 'Updated via terminal test script',
        start: {
            dateTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
            timeZone: 'Asia/Jakarta',
        },
        end: {
            dateTime: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
            timeZone: 'Asia/Jakarta',
        },
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
                action: 'update',
                eventId: eventId,
                event: updatedEvent,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            log('\n✅ Event updated successfully!', 'green');
            log(`   Event ID: ${data.event.id}`, 'blue');
            log(`   Summary: ${data.event.summary}`, 'cyan');
            log(`   Start: ${data.event.start.dateTime}`, 'yellow');
            log(`   End: ${data.event.end.dateTime}`, 'yellow');
        } else {
            log('❌ Failed to update event', 'red');
            log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
    }
}

async function deleteEvent(eventId) {
    if (!eventId) {
        log('❌ Please provide event ID', 'red');
        log('Usage: node test-gcal.js delete <eventId>', 'yellow');
        return;
    }

    log(`\n🗑️  Deleting event ${eventId}...`, 'cyan');

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-event-mutate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
                action: 'delete',
                eventId: eventId,
            }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            log('\n✅ Event deleted successfully!', 'green');
        } else {
            log('❌ Failed to delete event', 'red');
            log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
    }
}

async function listEvents() {
    log('\n📅 Fetching events from cache...', 'cyan');

    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/gcal-events?start=${startDate}&end=${endDate}`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                },
            }
        );
        const data = await response.json();

        if (data.success && data.events) {
            log(`\n✅ Found ${data.events.length} events:`, 'green');
            data.events.slice(0, 5).forEach((event, index) => {
                log(`\n${index + 1}. ${event.summary}`, 'cyan');
                log(`   ID: ${event.id}`, 'blue');
                log(`   Start: ${event.start.dateTime || event.start.date}`, 'yellow');
            });

            if (data.events.length > 5) {
                log(`\n... and ${data.events.length - 5} more events`, 'yellow');
            }
        } else {
            log('❌ Failed to fetch events', 'red');
            log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
    }
}

function showHelp() {
    log('\n📖 Google Calendar Integration Test Script', 'cyan');
    log('\nAvailable commands:', 'yellow');
    log('  node test-gcal.js status          - Check connection status');
    log('  node test-gcal.js list            - List events from cache');
    log('  node test-gcal.js create          - Create a test event');
    log('  node test-gcal.js update <eventId> - Update an event');
    log('  node test-gcal.js delete <eventId> - Delete an event');
    log('  node test-gcal.js help            - Show this help\n');
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

(async () => {
    switch (command) {
        case 'status':
            await checkStatus();
            break;
        case 'list':
            await listEvents();
            break;
        case 'create':
            await createEvent();
            break;
        case 'update':
            await updateEvent(arg);
            break;
        case 'delete':
            await deleteEvent(arg);
            break;
        case 'help':
            showHelp();
            break;
        default:
            log('❌ Unknown command', 'red');
            showHelp();
    }
})();
