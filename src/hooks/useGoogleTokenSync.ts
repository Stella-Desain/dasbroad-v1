import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to automatically sync Google OAuth tokens from Supabase Auth
 * to google_oauth_tokens table after successful Google login
 */
export function useGoogleTokenSync() {
    useEffect(() => {
        const syncTokens = async () => {
            try {
                // Get current session
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    console.log('[TokenSync] No session found');
                    return;
                }

                // Check if user logged in with Google
                const provider = session.user.app_metadata?.provider;
                console.log('[TokenSync] Provider:', provider);

                if (provider !== 'google') {
                    console.log('[TokenSync] Not a Google login, skipping');
                    return;
                }

                // Check provider tokens in session
                const providerToken = session.user.user_metadata?.provider_token;
                const providerRefreshToken = session.user.user_metadata?.provider_refresh_token;

                console.log('[TokenSync] Has provider_token:', !!providerToken);
                console.log('[TokenSync] Has refresh_token:', !!providerRefreshToken);

                // Check if we already have tokens in google_oauth_tokens
                const { data: existingTokens } = await supabase
                    .from('google_oauth_tokens')
                    .select('id')
                    .eq('user_label', 'default')
                    .maybeSingle();

                if (existingTokens) {
                    console.log('[TokenSync] Tokens already exist in database');
                    return;
                }

                // If no provider tokens, show warning
                if (!providerToken || !providerRefreshToken) {
                    console.warn('[TokenSync] No provider tokens in session!');
                    console.warn('[TokenSync] This means Supabase Auth did not store Google OAuth tokens.');
                    console.warn('[TokenSync] User needs to re-login or use manual OAuth flow.');

                    toast.error(
                        'Google Calendar not connected. Please use the Connect button in Calendar settings.',
                        { duration: 5000 }
                    );
                    return;
                }

                console.log('[TokenSync] Calling sync-google-tokens Edge Function...');

                // Call sync-google-tokens Edge Function
                const { data, error } = await supabase.functions.invoke('sync-google-tokens');

                if (error) {
                    console.error('[TokenSync] Failed to sync:', error);
                    toast.error('Failed to sync Google Calendar. Please try reconnecting.');
                    return;
                }

                if (data?.success) {
                    console.log('[TokenSync] ✅ Tokens synced successfully!');
                    toast.success('Google Calendar connected!');
                } else {
                    console.warn('[TokenSync] Sync returned non-success:', data);
                }
            } catch (error) {
                console.error('[TokenSync] Error:', error);
            }
        };

        // Sync tokens on mount and when auth state changes
        syncTokens();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN') {
                syncTokens();
            }
        });

        return () => subscription.unsubscribe();
    }, []);
}
