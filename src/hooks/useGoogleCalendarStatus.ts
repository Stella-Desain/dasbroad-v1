import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://oreoepyofghsmvvsxndh.supabase.co';

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

  const connect = useCallback(() => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `${SUPABASE_URL}/functions/v1/gcal-oauth-callback`,
      'google-oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GCAL_OAUTH_SUCCESS') {
        toast.success('Google Calendar connected!');
        refreshStatus();
      }
    };

    window.addEventListener('message', handleMessage);

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        refreshStatus();
      }
    }, 500);
  }, [refreshStatus]);

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
