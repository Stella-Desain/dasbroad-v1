# Automated Watch Channel Renewal Setup

## Overview

Google Calendar watch channels expire after ~7 days. This guide shows you how to set up **automated renewal** to ensure continuous push notifications.

---

## ✅ Recommended: Supabase Cron Jobs

**Best for**: Supabase-hosted projects (simplest setup)

### Step 1: Enable pg_cron Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 2: Create Cron Job

```sql
-- Run daily at 2 AM UTC to renew channels expiring within 24 hours
SELECT cron.schedule(
  'renew-gcal-watch-channels',  -- Job name
  '0 2 * * *',                   -- Cron schedule (daily at 2 AM UTC)
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/gcal-watch-renew',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) AS request_id;
  $$
);
```

**Replace**:
- `your-project.supabase.co` with your Supabase URL
- `YOUR_SERVICE_ROLE_KEY` with your service role key (from Supabase dashboard)

### Step 3: Verify Cron Job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check job execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'renew-gcal-watch-channels')
ORDER BY start_time DESC
LIMIT 10;
```

### Step 4: Test Manually

```bash
# Trigger renewal manually to test
curl -X POST "https://your-project.supabase.co/functions/v1/gcal-watch-renew" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Alternative: GitHub Actions

**Best for**: Projects with GitHub repository

### Step 1: Create Workflow File

Create `.github/workflows/renew-gcal-channels.yml`:

```yaml
name: Renew Google Calendar Watch Channels

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  
  # Allow manual trigger
  workflow_dispatch:

jobs:
  renew:
    runs-on: ubuntu-latest
    
    steps:
      - name: Call Renewal Endpoint
        run: |
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/gcal-watch-renew" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add secrets:
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 3: Test Workflow

1. Go to **Actions** tab in GitHub
2. Select "Renew Google Calendar Watch Channels"
3. Click **Run workflow** → **Run workflow**
4. Check logs for success

---

## Alternative: Vercel Cron Jobs

**Best for**: Projects deployed on Vercel

### Step 1: Create Cron API Route

Create `pages/api/cron/renew-gcal-channels.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify request is from Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/gcal-watch-renew`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const result = await response.json();
    
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Renewal error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
```

### Step 2: Configure Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-gcal-channels",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Step 3: Add Environment Variables

In Vercel dashboard:
1. Go to **Settings** → **Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `CRON_SECRET`: Generate a random secret (e.g., `openssl rand -hex 32`)

### Step 4: Deploy and Test

```bash
# Deploy to Vercel
vercel --prod

# Test manually
curl -X POST "https://your-app.vercel.app/api/cron/renew-gcal-channels" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Cron Schedule Reference

| Schedule | Description | Cron Expression |
|----------|-------------|-----------------|
| Every hour | Runs at minute 0 of every hour | `0 * * * *` |
| Every 6 hours | Runs at 00:00, 06:00, 12:00, 18:00 | `0 */6 * * *` |
| Daily at 2 AM | Runs once per day at 2:00 AM UTC | `0 2 * * *` |
| Twice daily | Runs at 2 AM and 2 PM UTC | `0 2,14 * * *` |
| Every Monday | Runs every Monday at 2 AM UTC | `0 2 * * 1` |

**Recommended**: `0 2 * * *` (daily at 2 AM UTC)

---

## Monitoring

### Check Last Renewal

```sql
SELECT 
  calendar_id,
  channel_id,
  expiration_at,
  updated_at,
  EXTRACT(EPOCH FROM (expiration_at - NOW())) / 3600 as hours_until_expiry
FROM gcal_watch_channels
ORDER BY expiration_at ASC;
```

### View Renewal Logs

```bash
# Supabase CLI
supabase functions logs gcal-watch-renew --tail

# Or in Supabase Dashboard
# Edge Functions → gcal-watch-renew → Logs
```

### Set Up Alerts (Optional)

Create a Supabase Edge Function that checks for expired channels and sends alerts:

```typescript
// supabase/functions/check-channel-health/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check for expired or expiring channels
  const { data: channels } = await supabase
    .from('gcal_watch_channels')
    .select('*')
    .lt('expiration_at', new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString());

  if (channels && channels.length > 0) {
    // Send alert (email, Slack, Discord, etc.)
    console.error('WARNING: Watch channels expiring soon:', channels);
    
    // Example: Send to Discord webhook
    await fetch(Deno.env.get('DISCORD_WEBHOOK_URL')!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `⚠️ ${channels.length} Google Calendar watch channel(s) expiring within 12 hours!`,
      }),
    });
  }

  return new Response(JSON.stringify({ checked: true, expiring: channels?.length || 0 }));
});
```

Schedule this to run every 6 hours:

```sql
SELECT cron.schedule(
  'check-gcal-channel-health',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-channel-health',
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Troubleshooting

### Cron Job Not Running

**Supabase**:
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check job status
SELECT * FROM cron.job WHERE jobname = 'renew-gcal-watch-channels';

-- Check recent runs
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'renew-gcal-watch-channels')
ORDER BY start_time DESC
LIMIT 5;
```

**GitHub Actions**:
- Check **Actions** tab for workflow runs
- Verify secrets are set correctly
- Check workflow file syntax

**Vercel**:
- Check **Deployments** → **Functions** → **Cron Jobs**
- Verify environment variables are set
- Check function logs

### Renewal Fails

**Check 1: Verify OAuth token is valid**
```sql
SELECT 
  access_token IS NOT NULL as has_access_token,
  token_expiry,
  token_expiry > NOW() as token_valid
FROM google_oauth_tokens
WHERE user_label = 'default';
```

**Check 2: Test renewal manually**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/gcal-watch-renew" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

**Check 3: View edge function logs**
```bash
supabase functions logs gcal-watch-renew --tail
```

---

## Summary

### ✅ Recommended Setup

1. **Use Supabase Cron Jobs** (simplest)
2. **Schedule**: Daily at 2 AM UTC (`0 2 * * *`)
3. **Renewal Threshold**: 24 hours before expiration
4. **Monitoring**: Check logs weekly

### 📋 Setup Checklist

- [ ] Choose scheduling method (Supabase Cron / GitHub Actions / Vercel Cron)
- [ ] Create cron job with correct schedule
- [ ] Add required environment variables/secrets
- [ ] Test manual renewal
- [ ] Verify cron job runs successfully
- [ ] Set up monitoring/alerts (optional)
- [ ] Document renewal schedule in team wiki

### 🎯 Expected Behavior

- **Channels expire**: ~7 days after creation
- **Renewal checks**: Daily at 2 AM UTC
- **Renewal triggers**: When expiration < 24 hours
- **New channel created**: Automatically replaces old channel
- **Downtime**: None (new channel created before old expires)

**Your automated renewal system is ready!** 🎉
