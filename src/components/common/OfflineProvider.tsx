/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isSyncing: false,
  pendingSyncCount: 0,
  syncNow: async () => {},
});

export const useOffline = () => useContext(OfflineContext);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const updatePendingCount = async () => {
      try {
        const { offlineDB } = await import('../../services/offlineDB');
        const pending = await offlineDB.getPendingSyncItems();
        setPendingSyncCount(pending.length);
      } catch (e) {
        console.error('Failed to get pending sync count:', e);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const syncNow = async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const { offlineDB } = await import('../../services/offlineDB');
      const { progressAPI } = await import('../../services/api');
      
      const pending = await offlineDB.getPendingSyncItems();
      
      for (const item of pending) {
        try {
          if (item.type === 'progress') {
            await progressAPI.review(item.payload);
          }
          if (item.id) {
            await offlineDB.markSynced(item.id);
          }
        } catch (e) {
          console.error('Failed to sync item:', e);
        }
      }
      
      await offlineDB.clearSynced();
      setPendingSyncCount(0);
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider value={{ isOnline, isSyncing, pendingSyncCount, syncNow }}>
      {children}
    </OfflineContext.Provider>
  );
};
