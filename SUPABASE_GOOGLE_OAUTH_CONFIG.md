# Supabase Google OAuth Configuration Guide

## 🎯 Goal
Configure Supabase to use Google OAuth with Calendar scopes, so users login once and get automatic Calendar access.

---

## Step 1: Configure Google Cloud Console

### **1.1 Open Google Cloud Console**
https://console.cloud.google.com/apis/credentials

### **1.2 Select Your Project**
- Project ID: `stellar-design-447609-f8` (or your project)

### **1.3 Add Authorized Redirect URIs**

Click on your OAuth 2.0 Client ID, then add:

```
https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

**Important**: Remove old redirect URIs that point to `/functions/v1/gcal-oauth-callback`

### **1.4 Verify Scopes**

In "OAuth consent screen", ensure these scopes are enabled:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

---

## Step 2: Configure Supabase Dashboard

### **2.1 Open Supabase Auth Settings**
https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/auth/providers

### **2.2 Enable Google Provider**

1. Click **Google** in the providers list
2. Toggle **Enable Sign in with Google** to ON
3. Fill in:
   - **Client ID**: `171590248000-tuo73u6dmm73e9gqeiujqucuaubir9h3.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx` (from your JSON file)

### **2.3 Add Additional Scopes**

In the **"Scopes"** field, add:
```
https://www.googleapis.com/auth/calendar
```

**Default scopes** (already included):
- `openid`
- `email`
- `profile`

**Final scopes** should be:
```
openid email profile https://www.googleapis.com/auth/calendar
```

### **2.4 Save Configuration**

Click **Save** at the bottom.

---

## Step 3: Verify Configuration

### **3.1 Test OAuth URL**

Open this URL in browser:
```
https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/authorize?provider=google
```

**Expected behavior:**
1. Redirects to Google login
2. Shows permission request for:
   - Email
   - Profile
   - **Google Calendar** ← This is important!
3. After authorize, redirects back to Supabase

### **3.2 Check Callback**

After authorization, you should be redirected to:
```
https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/callback?code=xxx&state=xxx
```

Then to your app's redirect URL (we'll configure this next).

---

## Step 4: Update Edge Function Secrets

Even though we're using Supabase Auth, we still need these secrets for token refresh:

```bash
npx supabase secrets set GOOGLE_CLIENT_ID="171590248000-tuo73u6dmm73e9gqeiujqucuaubir9h3.apps.googleusercontent.com"
npx supabase secrets set GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

---

## Troubleshooting

### **Error: "redirect_uri_mismatch"**

**Cause**: Redirect URI not added to Google Cloud Console

**Fix**:
1. Go to Google Cloud Console
2. Add `https://oreoepyofghsmvvsxndh.supabase.co/auth/v1/callback`
3. Save and wait 5 minutes

### **Error: "Access denied"**

**Cause**: Calendar scope not requested

**Fix**:
1. Check Supabase Auth settings
2. Ensure `https://www.googleapis.com/auth/calendar` is in scopes
3. Re-authorize

### **Error: "Invalid client"**

**Cause**: Wrong Client ID or Secret

**Fix**:
1. Verify Client ID matches Google Cloud Console
2. Verify Client Secret is correct
3. Re-save in Supabase Dashboard

---

## Next Steps

After configuration:
1. ✅ Implement frontend login with Google
2. ✅ Create auth callback handler to save tokens
3. ✅ Test end-to-end flow

---

**Created**: 2026-02-06  
**Status**: Configuration guide  
**Project**: Dasbroad v1
