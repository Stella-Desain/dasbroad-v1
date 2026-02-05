#!/usr/bin/env node

/**
 * Quick test: Create specific event
 * Usage: node create-test-event.js
 */

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yZW9lcHlvZmdoc212dnN4bmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQzMzAsImV4cCI6MjA4MDg4MDMzMH0.2oSgoXvZWgdLf24zO-412LNVL0VyFatiyzW6zirYhKA';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createEvent() {
    log('\n📝 Creating event: TESTING 1000', 'cyan');
    log('📅 Date: 20 February 2026', 'yellow');

    const testEvent = {
        summary: 'TESTING 1000',
        description: 'Test event created via terminal',
        start: {
            dateTime: '2026-02-20T10:00:00+08:00', // 20 Feb 2026, 10:00 AM Jakarta time
            timeZone: 'Asia/Jakarta',
        },
        end: {
            dateTime: '2026-02-20T11:00:00+08:00', // 20 Feb 2026, 11:00 AM Jakarta time
            timeZone: 'Asia/Jakarta',
        },
    };

    try {
        log('\n⏳ Sending request to API...', 'yellow');

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
            log(`\n📋 Event Details:`, 'cyan');
            log(`   Event ID: ${data.event.id}`, 'yellow');
            log(`   Summary: ${data.event.summary}`, 'green');
            log(`   Start: ${data.event.start.dateTime}`, 'yellow');
            log(`   End: ${data.event.end.dateTime}`, 'yellow');
            log(`\n🔗 Check your Google Calendar to see the event!`, 'cyan');
        } else {
            log('\n❌ Failed to create event', 'red');
            log(`\nError details:`, 'yellow');
            console.log(JSON.stringify(data, null, 2));

            if (data.error && data.error.includes('not connected')) {
                log('\n💡 Tip: Connect Google Calendar first:', 'cyan');
                log('   1. Open http://localhost:8080', 'yellow');
                log('   2. Click "Connect Google Calendar"', 'yellow');
                log('   3. Login and authorize', 'yellow');
                log('   4. Run this script again', 'yellow');
            }
        }
    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
    }
}

// Run
createEvent();
