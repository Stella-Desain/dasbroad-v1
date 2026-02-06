# 📖 Google Calendar OAuth Flow - Complete Guide

## 🎯 Cara Mengisi Table `google_oauth_tokens`

Table ini **HARUS** terisi agar Google Calendar integration berfungsi.

---

## ✅ FLOW USER YANG BENAR (Setelah Fix)

### **1. User Pertama Kali Buka Website**

```
Step 1: User buka website
   https://dasbroad-v1-xxx.vercel.app
   ↓
Step 2: User login dengan Supabase Auth
   (Email/Password)
   ↓
Step 3: Redirect ke Dashboard
   ↓
Step 4: User klik Calendar Panel
   ↓
Step 5: Sistem cek table google_oauth_tokens
   ↓
Step 6: Table KOSONG → Show "Connect Google Calendar" button
   ↓
Step 7: User klik button "Connect Google Calendar"
   ↓
Step 8: Popup OAuth Google muncul (600x700px)
   ↓
Step 9: User pilih Google Account
   ↓
Step 10: User klik "Allow" untuk authorize
   ↓
Step 11: Google redirect ke:
   /functions/v1/gcal-oauth-callback?code=xxx
   ↓
Step 12: Edge Function gcal-oauth-callback:
   - Exchange code untuk tokens
   - Simpan refresh_token ke table google_oauth_tokens
   - Simpan access_token (temporary)
   ↓
Step 13: ✅ Table terisi! User connected!
   ↓
Step 14: Popup close, UI refresh
   ↓
Step 15: Button "Connect" hilang, muncul "Sync" buttons
```

---

## 🔄 FLOW SETELAH CONNECTED

```
User buka Calendar Panel
   ↓
Sistem cek table google_oauth_tokens
   ↓
Table ADA ISI → Show sync controls
   ↓
User bisa:
   - Sync Now (incremental sync)
   - Full Sync (full sync)
   - Start Watch (enable push notifications)
```

---

## 📊 Data yang Tersimpan di Table

Setelah OAuth berhasil, table `google_oauth_tokens` akan terisi:

```sql
INSERT INTO google_oauth_tokens (
  id,
  user_label,
  access_token,
  refresh_token,
  token_expiry,
  scopes,
  created_at,
  updated_at
) VALUES (
  'uuid-generated',
  'default',
  'ya29.a0AfB_byD...', -- Temporary, expired dalam 1 jam
  '1//0gZ9X8Y7...', -- Permanent, untuk refresh access_token
  '2026-02-06 13:00:00+00',
  'https://www.googleapis.com/auth/calendar',
  '2026-02-06 12:00:00+00',
  '2026-02-06 12:00:00+00'
);
```

---

## 🛠️ Metode Mengisi Table (3 Cara)

### **Metode 1: Via UI (Recommended)** ✅

**Untuk User Biasa:**

1. Buka aplikasi
2. Login
3. Klik Calendar Panel
4. Klik tombol **"Connect Google Calendar"**
5. Login Google & authorize
6. ✅ Done! Table terisi otomatis

**Status Button:**
- ❌ **Not Connected**: Tombol "Connect Google Calendar" muncul
- ✅ **Connected**: Tombol hilang, muncul "Sync Now", "Full Sync", "Start Watch"

---

### **Metode 2: Manual Insert (Admin Only)** ⚠️

**TIDAK RECOMMENDED** - Hanya untuk testing/debugging

```sql
-- Login ke Supabase Dashboard
-- https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/editor

-- Insert manual (HARUS punya refresh_token valid dari Google)
INSERT INTO google_oauth_tokens (
  user_label,
  refresh_token,
  scopes
) VALUES (
  'default',
  '1//0gZ9X8Y7...', -- Dari Google OAuth
  'https://www.googleapis.com/auth/calendar'
);
```

⚠️ **Masalah**: Anda tidak bisa generate `refresh_token` manual. Harus dari OAuth flow.

---

### **Metode 3: Via API Call (Developer)** 🔧

**Untuk testing di development:**

```bash
# 1. Trigger OAuth flow
curl "https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-oauth-callback"

# 2. Follow redirect ke Google
# 3. Authorize
# 4. Google redirect back dengan code
# 5. Edge function auto-insert ke table
```

---

## 🔍 Cara Cek Table Terisi atau Tidak

### **Via Supabase Dashboard:**

1. Buka: https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/editor
2. Klik table **`google_oauth_tokens`**
3. Lihat data:
   - **Kosong** → User belum connect
   - **Ada data** → User sudah connect

### **Via SQL:**

```sql
SELECT 
  user_label,
  scopes,
  token_expiry,
  created_at,
  CASE 
    WHEN token_expiry > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as status
FROM google_oauth_tokens
WHERE user_label = 'default';
```

### **Via API:**

```bash
curl "https://oreoepyofghsmvvsxndh.supabase.co/functions/v1/gcal-status"
```

Response:
```json
{
  "success": true,
  "isConnected": true,  // ← Ini menunjukkan table terisi
  "hasSyncToken": false,
  "watchStatus": "none"
}
```

---

## 🚨 Troubleshooting

### **Problem 1: "No OAuth tokens found"**

**Penyebab**: Table `google_oauth_tokens` kosong

**Solusi**:
1. Buka Settings panel
2. Klik "Connect Google Calendar"
3. Authorize Google

---

### **Problem 2: Button "Connect" tidak muncul**

**Penyebab**: Conditional rendering salah

**Solusi**:
```tsx
// Pastikan ada kondisi ini di GoogleCalendarSettings.tsx
{!isConnected ? (
  <Button onClick={connect}>Connect Google Calendar</Button>
) : (
  <Button onClick={sync}>Sync Now</Button>
)}
```

---

### **Problem 3: OAuth popup blocked**

**Penyebab**: Browser block popup

**Solusi**:
1. Allow popup di browser settings
2. Atau klik button lagi

---

### **Problem 4: "Missing GOOGLE_CLIENT_ID"**

**Penyebab**: Secrets belum diset di Supabase

**Solusi**:
1. Buka: https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/settings/functions
2. Klik **Secrets** tab
3. Add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

## 👨‍💼 Admin: Cara Menambah/Edit Data

### **Cara 1: Via Supabase Dashboard** (Recommended)

**Menambah Data:**
1. Buka: https://supabase.com/dashboard/project/oreoepyofghsmvvsxndh/editor
2. Pilih table `google_oauth_tokens`
3. Klik **Insert** → **Insert row**
4. Isi:
   - `user_label`: `default`
   - `refresh_token`: `1//0gZ...` (dari Google OAuth)
   - `scopes`: `https://www.googleapis.com/auth/calendar`
5. Klik **Save**

**Edit Data:**
1. Klik row yang mau diedit
2. Edit field yang diperlukan
3. Klik **Save**

**Hapus Data:**
1. Klik row
2. Klik **Delete**
3. Confirm

---

### **Cara 2: Via SQL Editor**

**Menambah:**
```sql
INSERT INTO google_oauth_tokens (user_label, refresh_token, scopes)
VALUES ('default', '1//0gZ...', 'https://www.googleapis.com/auth/calendar');
```

**Edit:**
```sql
UPDATE google_oauth_tokens
SET refresh_token = '1//new_token...'
WHERE user_label = 'default';
```

**Hapus:**
```sql
DELETE FROM google_oauth_tokens
WHERE user_label = 'default';
```

---

### **Cara 3: Force Re-authorize**

Jika token corrupt atau invalid:

1. **Hapus data lama:**
   ```sql
   DELETE FROM google_oauth_tokens WHERE user_label = 'default';
   ```

2. **User klik "Connect Google Calendar" lagi**

3. **Authorize ulang**

4. **✅ Token baru tersimpan**

---

## 📝 Best Practices

### **Untuk User:**
- ✅ Gunakan button "Connect Google Calendar" di UI
- ❌ Jangan manual insert ke database

### **Untuk Admin:**
- ✅ Monitor table via Dashboard
- ✅ Hapus token lama jika ada masalah
- ✅ Biarkan user re-authorize via UI
- ❌ Jangan hardcode refresh_token

### **Untuk Developer:**
- ✅ Test OAuth flow di development
- ✅ Pastikan secrets sudah diset
- ✅ Handle error "No OAuth tokens found"
- ✅ Show clear UI untuk connect

---

## 🎯 Summary

**Cara Mengisi Table:**
1. ✅ **User klik "Connect Google Calendar"** (Paling mudah)
2. ⚠️ Manual insert via Dashboard (Hanya untuk debug)
3. 🔧 API call (Untuk developer)

**Cara Cek:**
- Dashboard: Lihat table `google_oauth_tokens`
- API: Call `/gcal-status`
- UI: Lihat status badge

**Cara Edit/Hapus:**
- Dashboard: Edit row langsung
- SQL: Run UPDATE/DELETE query
- UI: Force re-authorize (hapus + connect lagi)

---

**Created**: 2026-02-06  
**Project**: Dasbroad v1  
**Table**: `google_oauth_tokens`
