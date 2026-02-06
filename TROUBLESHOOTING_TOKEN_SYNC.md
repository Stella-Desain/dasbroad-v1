# Troubleshooting: Tokens Not Syncing

## Problem
User logged in with Google successfully, but `google_oauth_tokens` table is empty.

---

## Diagnosis Steps

### **Step 1: Check Browser Console**

1. Open app: https://dasbroad-v1.vercel.app
2. Open DevTools (F12)
3. Go to Console tab
4. Look for errors

**Expected logs:**
```
[GCal] Running boot sequence...
Google Calendar tokens synced successfully
```

**If you see errors:**
- "Failed to sync Google tokens" → Edge Function issue
- "No Google OAuth tokens found" → Supabase Auth issue
- No logs at all → Hook not running

---

### **Step 2: Check Supabase Auth Session**

Run this in browser console:

```javascript
// Check if provider tokens are stored
const session = await supabase.auth.getSession();
console.log('Provider token:', session.data.session?.user.user_metadata?.provider_token);
console.log('Refresh token:', session.data.session?.user.user_metadata?.provider_refresh_token);
```

**Expected:**
- Both should return token strings (not null/undefined)

**If null:**
- ❌ Supabase Auth did NOT store Google OAuth tokens
- **Cause**: Missing `access_type=offline` or scope not configured

---

### **Step 3: Manual Token Sync**

Copy entire content of `manual-token-sync.js` and paste in browser console.

**This will:**
1. Check if provider tokens exist in session
2. Manually save to database
3. Verify save was successful

---

## Common Issues & Fixes

### **Issue 1: Provider tokens not in session**

**Symptoms:**
- `provider_token` is null
- `provider_refresh_token` is null

**Cause:**
- Supabase Auth not configured to request offline access
- Calendar scope not added

**Fix:**

1. **Check Supabase Auth config:**
   ```
   https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/auth/providers
   ```

2. **Verify Google provider settings:**
   - ✅ Enabled
   - ✅ Client ID filled
   - ✅ Client Secret filled
   - ✅ Scopes: `https://www.googleapis.com/auth/calendar`

3. **Re-login:**
   - Logout from app
   - Clear browser cache/cookies
   - Login again with Google
   - Check permission screen shows Calendar

---

### **Issue 2: Edge Function not deployed**

**Symptoms:**
- No console logs about token sync
- Hook runs but no API call

**Fix:**

```bash
# Deploy Edge Function
npx supabase functions deploy sync-google-tokens

# Verify deployment
npx supabase functions list
```

**Expected output:**
```
sync-google-tokens  deployed
```

---

### **Issue 3: Edge Function errors**

**Symptoms:**
- Console shows "Failed to sync Google tokens"

**Fix:**

```bash
# Check Edge Function logs
npx supabase functions logs sync-google-tokens --tail

# Look for errors
```

**Common errors:**
- "Missing authorization header" → Auth token not passed
- "Invalid user token" → Token expired
- "Failed to get user session" → Supabase client issue

---

### **Issue 4: Hook not running**

**Symptoms:**
- No console logs at all
- useGoogleTokenSync not executing

**Fix:**

Check `src/App.tsx`:
```tsx
// This should be present
useGoogleTokenSync();
```

**Verify:**
1. Open DevTools → Sources
2. Find `App.tsx`
3. Set breakpoint on `useGoogleTokenSync()`
4. Reload page
5. Check if breakpoint hits

---

## Manual Fix (Temporary)

If automatic sync fails, manually save tokens:

### **Step 1: Get tokens from session**

```javascript
const session = await supabase.auth.getSession();
const providerToken = session.data.session?.user.user_metadata?.provider_token;
const providerRefreshToken = session.data.session?.user.user_metadata?.provider_refresh_token;

console.log('Access Token:', providerToken);
console.log('Refresh Token:', providerRefreshToken);
```

### **Step 2: Save to database**

```javascript
const { data, error } = await supabase
  .from('google_oauth_tokens')
  .insert({
    user_label: 'default',
    access_token: providerToken,
    refresh_token: providerRefreshToken,
    token_expiry: new Date(Date.now() + 3600000).toISOString(),
    scopes: 'https://www.googleapis.com/auth/calendar'
  });

console.log('Result:', data, error);
```

### **Step 3: Verify**

```sql
SELECT * FROM google_oauth_tokens WHERE user_label = 'default';
```

---

## Root Cause Analysis

The most likely cause is **Supabase Auth not storing provider tokens**.

### **Why this happens:**

1. **Missing `access_type=offline`** in OAuth request
   - Without this, Google doesn't return refresh_token
   - Supabase Auth won't store tokens

2. **Scope not configured** in Supabase
   - If Calendar scope not added, Supabase may not request it
   - Google won't grant Calendar permission

3. **Provider tokens not enabled** in Supabase
   - Some Supabase plans don't store provider tokens by default

### **How to verify:**

Check `src/pages/Auth.tsx` line 130-155:

```tsx
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'https://www.googleapis.com/auth/calendar',  // ← Must be here
    queryParams: {
      access_type: 'offline',  // ← Must be here
      prompt: 'consent',       // ← Must be here
    },
  },
});
```

---

## Testing Checklist

After fixing:

- [ ] Logout from app
- [ ] Clear browser cache
- [ ] Login with Google
- [ ] Check permission screen shows Calendar
- [ ] Check console for "tokens synced successfully"
- [ ] Verify database has tokens
- [ ] Test Calendar features

---

## Quick Test Script

Run this in browser console after login:

```javascript
// Quick diagnostic
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('✅ Logged in:', !!session);
  console.log('✅ Provider:', session?.user.app_metadata?.provider);
  console.log('✅ Provider token:', !!session?.user.user_metadata?.provider_token);
  console.log('✅ Refresh token:', !!session?.user.user_metadata?.provider_refresh_token);
  
  const { data: tokens } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_label', 'default');
  
  console.log('✅ Tokens in DB:', tokens?.length > 0);
  
  if (!session?.user.user_metadata?.provider_token) {
    console.error('❌ PROBLEM: Provider tokens not in session!');
    console.log('💡 Re-login required with correct OAuth config');
  } else if (!tokens || tokens.length === 0) {
    console.error('❌ PROBLEM: Tokens not saved to database!');
    console.log('💡 Run manual-token-sync.js');
  } else {
    console.log('✅ ALL GOOD! Tokens synced successfully!');
  }
})();
```

---

**Created**: 2026-02-06  
**Status**: Troubleshooting guide  
**Next**: Run diagnostics and apply fixes
