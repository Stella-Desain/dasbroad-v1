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

                if (!session) return;

                // Check if user logged in with Google
                const provider = session.user.app_metadata?.provider;
                if (provider !== 'google') return;

                // Check if we already have tokens in google_oauth_tokens
                const { data: existingTokens } = await supabase
                    .from('google_oauth_tokens')
                    .select('id')
                    .eq('user_label', 'default')
                    .maybeSingle();

                // If tokens already exist, skip sync
                if (existingTokens) return;

                // Call sync-google-tokens Edge Function
                const { data, error } = await supabase.functions.invoke('sync-google-tokens');

                if (error) {
                    console.error('Failed to sync Google tokens:', error);
                    toast.error('Failed to sync Google Calendar. Please try reconnecting.');
                    return;
                }

                if (data?.success) {
                    console.log('Google Calendar tokens synced successfully');
                    toast.success('Google Calendar connected!');
                }
            } catch (error) {
                console.error('Error in token sync:', error);
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
