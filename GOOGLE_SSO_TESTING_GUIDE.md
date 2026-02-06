# Google SSO Testing Guide

## ✅ Database Cleared Successfully!

All Google Calendar data has been deleted:
- ✅ `gcal_events_cache`: 0 rows
- ✅ `gcal_watch_channels`: 0 rows
- ✅ `gcal_sync_state`: 0 rows
- ✅ `google_oauth_tokens`: 0 rows

---

## 🧪 Testing Steps

### **Prerequisites**

Before testing, you MUST configure:

1. **Google Cloud Console**
   - Add redirect URI: `https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/callback`
   - Remove old URI: `https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback`

2. **Supabase Dashboard**
   - Enable Google OAuth provider
   - Add Client ID & Secret
   - Add scope: `https://www.googleapis.com/auth/calendar`

3. **Deploy Edge Function**
   ```bash
   npx supabase functions deploy sync-google-tokens
   ```

---

### **Test 1: Fresh Login with Google**

#### Steps:
1. Open app in browser
2. If logged in, logout first
3. Click "Sign in with Google"
4. Select your Google account
5. **IMPORTANT**: Check permission screen shows:
   - ✅ Email
   - ✅ Profile
   - ✅ **Google Calendar** ← Must be visible!
6. Click "Allow"

#### Expected Result:
- ✅ Redirects to `/dashboard`
- ✅ User is logged in
- ✅ Toast shows "Google Calendar connected!"

#### Verify in Database:
```sql
SELECT * FROM google_oauth_tokens WHERE user_label = 'default';
```

**Expected**:
- 1 row returned
- `access_token` is not null
- `refresh_token` is not null
- `scopes` contains 'calendar'

---

### **Test 2: Token Sync Verification**

#### Steps:
1. After login, open browser DevTools
2. Go to Console tab
3. Look for log: `Google Calendar tokens synced successfully`

#### Expected Result:
- ✅ No errors in console
- ✅ Success log appears
- ✅ No "Failed to sync" errors

---

### **Test 3: Calendar Access**

#### Steps:
1. Navigate to Calendar page
2. Open Google Calendar Settings
3. Check status indicators

#### Expected Result:
- ✅ Status badge shows "Connected"
- ✅ No "Connect Google Calendar" button
- ✅ "Sync Now" and "Full Sync" buttons visible
- ✅ Last sync time shows (after first sync)

---

### **Test 4: Create Event**

#### Steps:
1. Use terminal script:
   ```bash
   node create-test-event.js
   ```

#### Expected Result:
- ✅ No "Missing authorization header" error
- ✅ Event created successfully
- ✅ Event ID returned

#### Verify:
```bash
node test-gcal.js list
```

**Expected**:
- Event "TESTING 1000" appears in list

---

### **Test 5: Full Sync**

#### Steps:
1. Open Calendar Settings
2. Click "Full Sync" button
3. Wait for sync to complete

#### Expected Result:
- ✅ Button shows loading state
- ✅ Toast shows "Full sync completed"
- ✅ Events appear in calendar

#### Verify in Database:
```sql
SELECT COUNT(*) FROM gcal_events_cache;
```

**Expected**: Count > 0 (events cached)

---

### **Test 6: Watch Channel Setup**

#### Steps:
1. Open Calendar Settings
2. Click "Start/Restart Watch" button
3. Wait for setup to complete

#### Expected Result:
- ✅ Button shows loading state
- ✅ Toast shows "Watch channel started"
- ✅ Status badge shows "Watch Active"

#### Verify in Database:
```sql
SELECT * FROM gcal_watch_channels;
```

**Expected**:
- 1 row returned
- `channel_id` is not null
- `expiration_at` is in the future

---

## 🐛 Troubleshooting

### **Issue: Calendar permission not requested**

**Symptoms**:
- Google OAuth screen doesn't show Calendar permission
- Only shows Email and Profile

**Cause**: Scope not configured in Supabase

**Fix**:
1. Open Supabase Dashboard → Auth → Providers → Google
2. Add scope: `https://www.googleapis.com/auth/calendar`
3. Save
4. Logout and login again

---

### **Issue: "redirect_uri_mismatch"**

**Symptoms**:
- Error after clicking "Sign in with Google"
- Google shows error page

**Cause**: Redirect URI not added to Google Cloud Console

**Fix**:
1. Open Google Cloud Console
2. Add: `https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/callback`
3. Wait 5 minutes
4. Try again

---

### **Issue: Tokens not syncing**

**Symptoms**:
- Login successful
- But `google_oauth_tokens` table empty

**Cause**: Edge Function not deployed or erroring

**Fix**:
1. Deploy function:
   ```bash
   npx supabase functions deploy sync-google-tokens
   ```
2. Check logs:
   ```bash
   npx supabase functions logs sync-google-tokens
   ```
3. Verify secrets are set

---

### **Issue: "No OAuth tokens found"**

**Symptoms**:
- Error when trying to sync or create events
- Even though user is logged in

**Cause**: Token sync failed

**Fix**:
1. Check browser console for errors
2. Manually trigger sync:
   ```javascript
   // In browser console
   const { data, error } = await supabase.functions.invoke('sync-google-tokens');
   console.log(data, error);
   ```
3. Check Edge Function logs

---

## 📊 Success Criteria

All tests should pass:
- ✅ Test 1: Login with Google
- ✅ Test 2: Token sync verification
- ✅ Test 3: Calendar access
- ✅ Test 4: Create event
- ✅ Test 5: Full sync
- ✅ Test 6: Watch channel setup

---

## 🔄 Reset Database (If Needed)

To clear database and test again:

```bash
node clear-database-simple.js
```

Then repeat all tests.

---

**Created**: 2026-02-06  
**Status**: Ready for testing  
**Database**: Cleared and ready
