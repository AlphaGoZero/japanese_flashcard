import React from 'react';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useOffline } from './OfflineProvider';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount, syncNow } = useOffline();

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOnline ? (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg">
          <WifiOff size={18} />
          <span className="text-sm font-medium">Offline</span>
        </div>
      ) : pendingSyncCount > 0 ? (
        <button
          onClick={syncNow}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
        >
          <CloudOff size={18} className={isSyncing ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">
            {isSyncing ? 'Syncing...' : `${pendingSyncCount} pending`}
          </span>
          {!isSyncing && (
            <RefreshCw size={16} />
          )}
        </button>
      ) : null}
    </div>
  );
};
