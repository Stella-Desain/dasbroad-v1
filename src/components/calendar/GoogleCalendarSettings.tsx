import { format, formatDistanceToNow } from 'date-fns';
import {
  RefreshCw,
  Play,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Link2,
  Link2Off,
  Radio,
  RadioTower,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarStatus';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function GoogleCalendarSettings() {
  const {
    status,
    loading,
    syncing,
    watchStarting,
    triggerFullSync,
    triggerIncrementalSync,
    startWatch,
    connect,
  } = useGoogleCalendarStatus();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-60" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.isConnected ?? false;
  const syncStatus = status?.syncState?.status ?? null;
  const lastSyncAt = status?.syncState?.lastSyncAt;
  const watchStatus = status?.watchStatus ?? 'none';
  const watchExpiresAt = status?.watchChannel?.expiresAt;

  const getConnectionBadge = () => {
    if (isConnected) {
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="bg-red-500/20 text-red-600 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Not Connected
      </Badge>
    );
  };

  const getSyncStatusBadge = () => {
    if (syncStatus === 'syncing' || syncing) {
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Syncing
        </Badge>
      );
    }
    if (syncStatus === 'error') {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    if (syncStatus === 'idle' && lastSyncAt) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Never synced
      </Badge>
    );
  };

  const getWatchStatusBadge = () => {
    switch (watchStatus) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30">
            <RadioTower className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <Radio className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Radio className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Link2 className="h-5 w-5 text-green-500" />
          ) : (
            <Link2Off className="h-5 w-5 text-muted-foreground" />
          )}
          Google Calendar
        </CardTitle>
        <CardDescription>
          Manage your Google Calendar connection and sync settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection</span>
            {getConnectionBadge()}
          </div>

          {isConnected && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Sync</span>
                {getSyncStatusBadge()}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Push Notifications</span>
                <div className="flex items-center gap-2">
                  {getWatchStatusBadge()}
                  {watchExpiresAt && watchStatus === 'active' && (
                    <span className="text-xs text-muted-foreground">
                      Expires {format(new Date(watchExpiresAt), 'MMM d, HH:mm')}
                    </span>
                  )}
                </div>
              </div>

              {status?.syncState?.errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    {status.syncState.errorMessage}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* Actions Section */}
        <div className="space-y-3">
          {!isConnected ? (
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Google Calendar requires additional authorization
                </p>
                <p className="text-xs text-muted-foreground">
                  Click below to grant Calendar access
                </p>
              </div>
              <Button onClick={connect} className="w-full" size="lg">
                <Link2 className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={triggerIncrementalSync}
                  disabled={syncing}
                  className="w-full"
                >
                  <RefreshCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
                  Sync Now
                </Button>

                <Button
                  variant="outline"
                  onClick={triggerFullSync}
                  disabled={syncing}
                  className="w-full"
                >
                  <RotateCw className={cn('h-4 w-4 mr-2', syncing && 'animate-spin')} />
                  Full Sync
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={startWatch}
                disabled={watchStarting || watchStatus === 'active'}
                className="w-full"
              >
                <Play className={cn('h-4 w-4 mr-2', watchStarting && 'animate-pulse')} />
                {watchStatus === 'active' ? 'Watch Active' : 'Start/Restart Watch'}
              </Button>
            </>
          )}
        </div>

        {/* Info Section */}
        {isConnected && status?.oauthInfo && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                Connected: {format(new Date(status.oauthInfo.connectedAt), 'MMM d, yyyy HH:mm')}
              </p>
              <p>Scopes: {status.oauthInfo.scopes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
