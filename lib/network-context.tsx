import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { processSyncQueue, getPendingCount } from './sync-queue';
import { supabase, isConfigured } from './supabase';

interface NetworkContextType {
  isOnline: boolean;
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  pendingCount: 0,
  refreshPendingCount: async () => {},
});

async function checkConnectivity(): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { error } = await supabase.from('expenses').select('id', { count: 'exact', head: true }).limit(0);
    return !error;
  } catch {
    return false;
  }
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncing = useRef(false);
  const prevOnline = useRef(true);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const checkNetwork = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOnline(online);

    if (online && !prevOnline.current && !isSyncing.current) {
      isSyncing.current = true;
      processSyncQueue()
        .then(() => refreshPendingCount())
        .finally(() => { isSyncing.current = false; });
    }
    prevOnline.current = online;
  }, [refreshPendingCount]);

  useEffect(() => {
    checkNetwork();
    refreshPendingCount();

    const interval = setInterval(checkNetwork, 15000);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkNetwork();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [checkNetwork, refreshPendingCount]);

  return (
    <NetworkContext.Provider value={{ isOnline, pendingCount, refreshPendingCount }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
