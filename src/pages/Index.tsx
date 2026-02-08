import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const Index = () => {
  const { isAuthenticated, loading } = useAuthStore();
  const [isHandlingOAuth, setIsHandlingOAuth] = useState(false);

  useEffect(() => {
    // Check if this is an OAuth callback (has hash or code param)
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

      const hasOAuthParams = hashParams.has('access_token') ||
        searchParams.has('code') ||
        window.location.hash.includes('access_token');

      if (!hasOAuthParams) {
        return; // Not an OAuth callback
      }

      setIsHandlingOAuth(true);

      try {
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
        );

        // Get session from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.error('OAuth session error:', sessionError);
          toast.error('Failed to complete OAuth');
          setIsHandlingOAuth(false);
          return;
        }

        console.log('OAuth session obtained, syncing Google tokens...');

        // Call sync function to store tokens
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-google-tokens`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          toast.success('Google Calendar connected successfully!');
        } else {
          const errorText = await response.text();
          console.error('Token sync failed:', errorText);
          toast.error('Failed to sync Google Calendar');
        }

        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to complete OAuth');
      } finally {
        setIsHandlingOAuth(false);
      }
    };

    handleOAuthCallback();
  }, []);

  if (loading || isHandlingOAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {isHandlingOAuth && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Connecting Google Calendar...</p>
            </>
          )}
          {loading && !isHandlingOAuth && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/auth'} replace />;
};

export default Index;
