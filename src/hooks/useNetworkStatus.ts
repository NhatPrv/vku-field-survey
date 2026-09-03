import { useState, useEffect } from 'react';
import { networkManager } from '../services/network';

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>(() => networkManager.getStatus());

  useEffect(() => {
    const unsubscribe = networkManager.addListener((isOnline, connectionType) => {
      setNetworkState({ isOnline, connectionType });
    });
    return unsubscribe;
  }, []);

  return networkState;
}
