/**
 * Check OAuth Credentials
 * This script verifies Google OAuth Client ID and Secret
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Checking Google OAuth Credentials');
console.log('='.repeat(60));

// Check environment variables
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log('\n📋 Local Environment Variables (.env):');
console.log('-'.repeat(60));

if (clientId) {
    console.log('✅ GOOGLE_CLIENT_ID found');
    console.log('   Length:', clientId.length, 'characters');
    console.log('   Preview:', clientId.substring(0, 20) + '...' + clientId.substring(clientId.length - 10));
    console.log('   Ends with:', clientId.endsWith('.apps.googleusercontent.com') ? '✅ .apps.googleusercontent.com' : '❌ Invalid format');
} else {
    console.log('❌ GOOGLE_CLIENT_ID not found in .env');
}

if (clientSecret) {
    console.log('\n✅ GOOGLE_CLIENT_SECRET found');
    console.log('   Length:', clientSecret.length, 'characters');
    console.log('   Preview:', clientSecret.substring(0, 10) + '***' + clientSecret.substring(clientSecret.length - 5));
} else {
    console.log('\n❌ GOOGLE_CLIENT_SECRET not found in .env');
}

console.log('\n' + '='.repeat(60));
console.log('📝 Notes:');
console.log('- These are LOCAL environment variables');
console.log('- Supabase Edge Functions use DIFFERENT secrets');
console.log('- Check Supabase secrets with: npx supabase secrets list');
console.log('='.repeat(60));
