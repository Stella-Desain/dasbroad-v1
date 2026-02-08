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

        console.log('OAuth session obtained, user:', session.user.id);
        console.log('Session has provider_token:', !!session.provider_token);
        console.log('Session has provider_refresh_token:', !!session.provider_refresh_token);

        // Try to get tokens from session first
        let providerToken = session.provider_token;
        let providerRefreshToken = session.provider_refresh_token;

        // If not in session, fetch from auth.identities
        if (!providerToken) {
          console.log('No provider token in session, fetching from auth.identities...');

          const { data: identities, error: identitiesError } = await supabase
            .from('identities')
            .select('provider_token, provider_refresh_token, identity_data')
            .eq('user_id', session.user.id)
            .eq('provider', 'google')
            .single();

          if (identitiesError) {
            console.error('Failed to fetch identities:', identitiesError);

            // Try alternative: use service role to query auth schema
            console.log('Trying to call sync-google-tokens Edge Function as fallback...');
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
              console.log('Edge Function sync successful!');
              toast.success('Google Calendar connected successfully!');
            } else {
              const errorText = await response.text();
              console.error('Edge Function sync failed:', errorText);
              toast.error('Failed to save Google Calendar connection');
            }

            window.history.replaceState({}, document.title, '/');
            setIsHandlingOAuth(false);
            return;
          }

          providerToken = identities?.provider_token;
          providerRefreshToken = identities?.provider_refresh_token;
          console.log('Fetched from identities - has token:', !!providerToken);
        }

        if (!providerToken) {
          console.error('No provider token found in session or identities');
          console.log('Session keys:', Object.keys(session));
          toast.error('Failed to get Google Calendar access - no token found');
          setIsHandlingOAuth(false);
          return;
        }

        console.log('Provider tokens found, storing in database...');

        // Calculate token expiry (default 1 hour)
        const tokenExpiry = new Date(Date.now() + 3600 * 1000).toISOString();

        // Store tokens directly in google_oauth_tokens table
        const { error: upsertError } = await supabase
          .from('google_oauth_tokens')
          .upsert({
            user_label: 'default',
            refresh_token: providerRefreshToken || null,
            access_token: providerToken,
            token_expiry: tokenExpiry,
            scopes: 'https://www.googleapis.com/auth/calendar',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_label' });

        if (upsertError) {
          console.error('Failed to store tokens:', upsertError);
          console.error('Error details:', JSON.stringify(upsertError, null, 2));
          toast.error(`Failed to save Google Calendar connection: ${upsertError.message}`);
        } else {
          console.log('Tokens stored successfully!');
          toast.success('Google Calendar connected successfully!');
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
