import { useState, useEffect } from 'react';
import { Network, type ConnectionStatus } from '@capacitor/network';

export interface NetworkState {
  isOnline: boolean;
  connectionType: string;
}

export function useNetworkStatus(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    let isMounted = true;

    // 1. Khởi tạo trạng thái ban đầu từ Capacitor Network
    Network.getStatus()
      .then((status: ConnectionStatus) => {
        if (isMounted) {
          setNetworkState({
            isOnline: status.connected,
            connectionType: status.connectionType,
          });
        }
      })
      .catch(() => {
        // Fallback sang navigator.onLine nếu plugin chưa sẵn sàng
        if (isMounted) {
          setNetworkState((prev) => ({
            ...prev,
            isOnline: navigator.onLine,
          }));
        }
      });

    // 2. Lắng nghe qua Capacitor Network listener
    const networkListenerPromise = Network.addListener('networkStatusChange', (status) => {
      if (isMounted) {
        setNetworkState({
          isOnline: status.connected,
          connectionType: status.connectionType,
        });
      }
    });

    // 3. Lắng nghe thêm sự kiện chuẩn trình duyệt (Browser Online/Offline)
    const handleOnline = () => {
      if (isMounted) {
        setNetworkState((prev) => ({ ...prev, isOnline: true }));
      }
    };
    const handleOffline = () => {
      if (isMounted) {
        setNetworkState((prev) => ({ ...prev, isOnline: false }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      networkListenerPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, []);

  return networkState;
}
