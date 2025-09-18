'use client';

import { useOnlineStatus } from '@/lib/pwa-utils';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant="secondary" className="flex items-center gap-2 bg-orange-100 text-orange-800 border-orange-200">
        <WifiOff className="h-3 w-3" />
        Offline
      </Badge>
    </div>
  );
}

export function ConnectionStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}