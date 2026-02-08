import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * OAuth Callback Handler
 * Handles the redirect after Google OAuth consent
 * Syncs tokens from Supabase Auth to google_oauth_tokens table
 */
export function OAuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const supabase = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
                );

                // Get session from URL hash/params
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('Session error:', sessionError);
                    toast.error('OAuth failed: ' + sessionError.message);
                    navigate('/');
                    return;
                }

                if (!session) {
                    console.log('No session found, user might have cancelled OAuth');
                    navigate('/');
                    return;
                }

                console.log('OAuth session obtained, syncing tokens...');

                // Call sync function to store tokens in google_oauth_tokens table
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

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Sync failed:', errorText);
                    toast.error('Failed to sync Google Calendar tokens');
                    navigate('/');
                    return;
                }

                const result = await response.json();
                console.log('Sync result:', result);

                toast.success('Google Calendar connected successfully!');
                navigate('/');
            } catch (error) {
                console.error('OAuth callback error:', error);
                toast.error('Failed to complete OAuth');
                navigate('/');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg">Connecting Google Calendar...</p>
            </div>
        </div>
    );
}
