import React, { createContext, useContext, useState, useEffect } from 'react';
import { sync as realSync } from '@/lib/sync';

type SyncContextType = {
  isOffline: boolean;
  isSyncing: boolean;
  error: Error | null;
  sync: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const triggerSync = async () => {
    // Need to get the latest state since this is often called inside an event listener
    const currentlyOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    if (currentlyOffline) return;
    
    setIsSyncing(true);
    setError(null);
    try {
      if (typeof realSync === 'function') {
        await realSync();
      } else {
        // No-op for web fallback
      }
    } catch (e) {
      console.error('Sync failed', e);
      setError(e as Error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
       setIsOffline(false);
       triggerSync(); // auto sync on reconnect
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOffline, isSyncing, error, sync: triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}
