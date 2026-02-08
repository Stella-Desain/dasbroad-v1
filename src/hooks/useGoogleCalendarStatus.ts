import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface GoogleCalendarStatus {
  isConnected: boolean;
  hasSyncToken: boolean;
  syncState: {
    status: 'idle' | 'syncing' | 'error' | null;
    lastFullSyncAt: string | null;
    lastIncrementalSyncAt: string | null;
    lastSyncAt: string | null;
    errorMessage: string | null;
  } | null;
  watchChannel: {
    channelId: string;
    resourceId: string;
    expiresAt: string;
    status: 'active' | 'expired' | 'expiring_soon';
  } | null;
  watchStatus: 'none' | 'active' | 'expired' | 'expiring_soon';
  oauthInfo: {
    connectedAt: string;
    scopes: string;
  } | null;
}

interface UseGoogleCalendarStatusResult {
  status: GoogleCalendarStatus | null;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  watchStarting: boolean;
  refreshStatus: () => Promise<void>;
  triggerFullSync: () => Promise<void>;
  triggerIncrementalSync: () => Promise<void>;
  startWatch: () => Promise<void>;
  connect: () => void;
  runBootSequence: () => Promise<void>;
}

export function useGoogleCalendarStatus(): UseGoogleCalendarStatusResult {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [watchStarting, setWatchStarting] = useState(false);
  const bootSequenceRun = useRef(false);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-status`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      if (data.success) {
        setStatus({
          isConnected: data.isConnected,
          hasSyncToken: data.hasSyncToken,
          syncState: data.syncState,
          watchChannel: data.watchChannel,
          watchStatus: data.watchStatus,
          oauthInfo: data.oauthInfo,
        });
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerFullSync = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullSync: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Full sync failed');
      }

      toast.success('Full sync completed');
      await refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Full sync failed';
      toast.error(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [refreshStatus]);

  const triggerIncrementalSync = useCallback(async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullSync: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }

      toast.success('Sync completed');
      await refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      toast.error(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [refreshStatus]);

  const startWatch = useCallback(async () => {
    setWatchStarting(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-watch-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start watch');
      }

      toast.success('Watch channel started');
      await refreshStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start watch';
      toast.error(message);
      throw err;
    } finally {
      setWatchStarting(false);
    }
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    try {
      // Use Supabase Auth built-in Google OAuth
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar',
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(`Failed to connect: ${error.message}`);
        throw error;
      }

      // OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect Google Calendar';
      toast.error(message);
      throw err;
    }
  }, []);

  // Boot sequence: check connection -> run fullSync if no token -> start watch
  const runBootSequence = useCallback(async () => {
    console.log('[GCal] Running boot sequence...');

    // Refresh status first
    await refreshStatus();

    // Get fresh status
    const response = await fetch(`${SUPABASE_URL}/functions/v1/gcal-status`);
    if (!response.ok) return;

    const data = await response.json();
    if (!data.success || !data.isConnected) {
      console.log('[GCal] Not connected, skipping boot sequence');
      return;
    }

    // If no sync token, run full sync
    if (!data.hasSyncToken) {
      console.log('[GCal] No sync token found, running initial full sync...');
      try {
        await triggerFullSync();
      } catch {
        console.error('[GCal] Initial full sync failed');
        return;
      }
    }

    // Start watch if not active
    if (data.watchStatus !== 'active') {
      console.log('[GCal] Watch not active, starting watch channel...');
      try {
        await startWatch();
      } catch {
        console.error('[GCal] Failed to start watch channel');
      }
    }

    console.log('[GCal] Boot sequence complete');
  }, [refreshStatus, triggerFullSync, startWatch]);

  // Initial load
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Run boot sequence once when connected
  useEffect(() => {
    if (status?.isConnected && !bootSequenceRun.current) {
      bootSequenceRun.current = true;
      runBootSequence();
    }
  }, [status?.isConnected, runBootSequence]);

  return {
    status,
    loading,
    error,
    syncing,
    watchStarting,
    refreshStatus,
    triggerFullSync,
    triggerIncrementalSync,
    startWatch,
    connect,
    runBootSequence,
  };
}
