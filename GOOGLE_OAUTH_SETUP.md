# 🔐 Google OAuth Client ID Setup Guide

## 📋 Data yang Harus Diisi

Berdasarkan screenshot Anda, berikut data yang perlu diisi:

---

## 1️⃣ Authorized JavaScript Origins

**Untuk Development (localhost)**:
```
http://localhost:8080
http://127.0.0.1:8080
```

**Untuk Production (Vercel)**:
```
https://dasbroad-v1-cmoeb9t9d-bintang-saputras-projects.vercel.app
https://dasbroad-v1.vercel.app
```

**Catatan**: 
- Jangan tambahkan trailing slash `/` di akhir URL
- Tambahkan semua URL yang akan digunakan (dev + production)

---

## 2️⃣ Authorized Redirect URIs

**Untuk Supabase Edge Functions**:
```
https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback
```

**Untuk Development (jika perlu)**:
```
http://localhost:8080/auth/callback
```

**Catatan**:
- Ini adalah URL yang Google akan redirect setelah user login
- Harus match dengan callback URL di backend Anda
- Supabase function URL format: `https://[PROJECT_ID].supabase.co/functions/v1/[FUNCTION_NAME]`

---

## 📝 Lengkap Form Google OAuth

### Step 1: Authorized JavaScript Origins
Isi field **"URIs 1"** dengan:
```
http://localhost:8080
```

Klik **"+ Add URI"**, lalu tambahkan:
```
http://127.0.0.1:8080
```

Klik **"+ Add URI"** lagi, tambahkan:
```
https://dasbroad-v1-cmoeb9t9d-bintang-saputras-projects.vercel.app
```

### Step 2: Authorized Redirect URIs
Isi field **"URIs 1"** dengan:
```
https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback
```

Klik **"+ Add URI"**, tambahkan (optional untuk dev):
```
http://localhost:8080/auth/callback
```

---

## 🔑 Setelah Mendapat Client ID & Secret

Setelah Anda klik **"Create"**, Google akan memberikan:
1. **Client ID** (panjang, seperti: `123456789-abc123.apps.googleusercontent.com`)
2. **Client Secret** (string random, seperti: `GOCSPX-abc123xyz`)

---

## 📍 Dimana Menyimpan Client ID & Secret

### **PENTING**: 
- ❌ **JANGAN** simpan di frontend `.env`
- ✅ **HARUS** simpan di Supabase Edge Functions secrets

---

## 🔧 Cara Menyimpan di Supabase

### Option 1: Via Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard**:
   ```
   https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh
   ```

2. **Navigate to**:
   ```
   Settings → Edge Functions → Secrets
   ```

3. **Add New Secret**:
   
   **Secret 1**:
   - Name: `GOOGLE_CLIENT_ID`
   - Value: `[paste Client ID dari Google]`
   
   **Secret 2**:
   - Name: `GOOGLE_CLIENT_SECRET`
   - Value: `[paste Client Secret dari Google]`

4. **Click "Add Secret"** untuk masing-masing

---

### Option 2: Via Supabase CLI

Jika Anda punya Supabase CLI installed:

```bash
# Set Client ID
supabase secrets set GOOGLE_CLIENT_ID="YOUR_CLIENT_ID_HERE"

# Set Client Secret
supabase secrets set GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET_HERE"
```

---

## 📂 File yang Menggunakan Secrets

Secrets ini akan otomatis tersedia di **semua Supabase Edge Functions**:

### 1. `gcal-oauth-callback/index.ts`
```typescript
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
```

### 2. `gcal-sync/index.ts`
```typescript
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
```

### 3. `gcal-event-mutate/index.ts`
```typescript
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
```

### 4. `gcal-watch-setup/index.ts`
```typescript
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
```

### 5. `gcal-watch-renew/index.ts`
```typescript
const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
```

**Catatan**: Anda **TIDAK perlu** edit file-file ini! Secrets otomatis tersedia sebagai environment variables.

---

## ✅ Checklist Setup

### Before Creating OAuth Client:
- [ ] Pastikan Google Cloud Project sudah dibuat
- [ ] Enable Google Calendar API
- [ ] Configure OAuth Consent Screen

### When Creating OAuth Client:
- [ ] Application type: **Web application**
- [ ] Name: `Dasbroad v1` (atau nama lain)
- [ ] Authorized JavaScript origins:
  - [ ] `http://localhost:8080`
  - [ ] `http://127.0.0.1:8080`
  - [ ] `https://dasbroad-v1-cmoeb9t9d-bintang-saputras-projects.vercel.app`
- [ ] Authorized redirect URIs:
  - [ ] `https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback`

### After Getting Credentials:
- [ ] Copy Client ID
- [ ] Copy Client Secret
- [ ] Add to Supabase Secrets (Dashboard or CLI)
- [ ] **JANGAN** commit ke Git
- [ ] **JANGAN** simpan di frontend `.env`

---

## 🚨 Security Best Practices

### ✅ DO:
- ✅ Simpan di Supabase Edge Functions secrets
- ✅ Gunakan HTTPS untuk production
- ✅ Restrict OAuth scopes (hanya `calendar.events`)
- ✅ Validate redirect URIs

### ❌ DON'T:
- ❌ Simpan di frontend `.env`
- ❌ Commit ke Git
- ❌ Share di public
- ❌ Hardcode di source code

---

## 🔄 Cara Verify Setup Berhasil

### Test 1: Check Secrets di Supabase
```bash
# Via Supabase CLI
supabase secrets list
```

Expected output:
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Test 2: Test OAuth Flow
1. Buka aplikasi: `http://localhost:8080`
2. Klik "Connect Google Calendar"
3. OAuth popup harus terbuka
4. Login dengan Google account
5. Authorize aplikasi
6. Redirect kembali ke aplikasi
7. Status "Connected" muncul

### Test 3: Check Database
```sql
-- Cek apakah refresh token tersimpan
SELECT user_label, scopes, created_at 
FROM google_oauth_tokens 
WHERE user_label = 'default';
```

Expected: 1 row dengan scopes = `calendar.events`

---

## 📋 Summary: Apa yang Harus Anda Lakukan

### Step 1: Isi Form Google OAuth
```
Authorized JavaScript origins:
  - http://localhost:8080
  - http://127.0.0.1:8080
  - https://dasbroad-v1-cmoeb9t9d-bintang-saputras-projects.vercel.app

Authorized redirect URIs:
  - https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback
```

### Step 2: Copy Credentials
Setelah klik "Create", copy:
- Client ID
- Client Secret

### Step 3: Add to Supabase
```
Supabase Dashboard → Settings → Edge Functions → Secrets

Add:
  GOOGLE_CLIENT_ID = [paste Client ID]
  GOOGLE_CLIENT_SECRET = [paste Client Secret]
```

### Step 4: Test
```
1. Buka http://localhost:8080
2. Klik "Connect Google Calendar"
3. Login & authorize
4. Verify "Connected" status
```

---

## 🆘 Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: Redirect URI tidak match  
**Fix**: Pastikan redirect URI di Google Console sama persis dengan yang di code:
```
https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback
```

### Error: "origin_mismatch"
**Cause**: JavaScript origin tidak match  
**Fix**: Tambahkan `http://localhost:8080` ke Authorized JavaScript origins

### Error: "invalid_client"
**Cause**: Client ID/Secret salah  
**Fix**: Verify secrets di Supabase:
```bash
supabase secrets list
```

### Error: "access_denied"
**Cause**: User menolak authorization  
**Fix**: User harus klik "Allow" saat OAuth popup

---

## 📞 Need Help?

Jika ada error, check:
1. **Supabase Edge Function Logs**:
   ```
   Supabase Dashboard → Edge Functions → Logs
   ```

2. **Browser Console**:
   ```
   F12 → Console tab
   ```

3. **Network Tab**:
   ```
   F12 → Network tab → Filter: gcal
   ```

---

## ✅ Final Checklist

Sebelum testing, pastikan:
- [ ] Google OAuth Client ID created
- [ ] Authorized JavaScript origins configured
- [ ] Authorized redirect URIs configured
- [ ] Client ID added to Supabase secrets
- [ ] Client Secret added to Supabase secrets
- [ ] Dev server running (`npm run dev`)
- [ ] Supabase Edge Functions deployed

**Setelah semua ✅, OAuth flow akan bekerja!** 🎉

---

**Created by**: Antigravity AI  
**Date**: 2026-02-06  
**Project**: Dasbroad v1
