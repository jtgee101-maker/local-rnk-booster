import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * OfflineBanner Component
 * Shows network status and sync information
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isVisible, setIsVisible] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced | error
  const [pendingCount, setPendingCount] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(true);
      // Auto-sync when coming back online
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    const handleSWMessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'sync-start':
          setSyncStatus('syncing');
          setSyncProgress(0);
          break;
          
        case 'sync-progress':
          setSyncProgress(data.progress);
          break;
          
        case 'sync-complete':
          setSyncStatus('synced');
          setPendingCount(0);
          setTimeout(() => setIsVisible(false), 3000);
          break;
          
        case 'sync-error':
          setSyncStatus('error');
          break;
          
        case 'queue-update':
          setPendingCount(data.count);
          break;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // Check pending actions on mount
    checkPendingActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  const checkPendingActions = async () => {
    try {
      const db = await openSyncDB();
      // Guard: ensure the object store exists before transacting
      if (!db.objectStoreNames.contains('localrnk-sync-queue')) return;
      const tx = db.transaction('localrnk-sync-queue', 'readonly');
      const store = tx.objectStore('localrnk-sync-queue');
      const countReq = store.count();
      countReq.onsuccess = () => setPendingCount(countReq.result);
    } catch (_error) {
      // Silently ignore — IDB may not be initialized yet on first load
    }
  };

  const syncPendingActions = async () => {
    if (syncStatus === 'syncing') return;
    
    setSyncStatus('syncing');
    
    try {
      // Trigger background sync
      if ('serviceWorker' in navigator && 'sync' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('localrnk-sync');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const dismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Auto-hide when synced
  useEffect(() => {
    if (syncStatus === 'synced' && isOnline) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, isOnline]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'transition-all duration-300 animate-in slide-in-from-bottom-5',
        isOnline 
          ? 'bg-green-50 border border-green-200 text-green-900'
          : 'bg-amber-50 border border-amber-200 text-amber-900'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Cloud className="w-5 h-5 text-green-600" />
        ) : (
          <CloudOff className="w-5 h-5 text-amber-600" />
        )}
        
        <span className="text-sm font-medium">
          {!isOnline ? (
            'You\'re offline'
          ) : syncStatus === 'syncing' ? (
            'Syncing...'
          ) : syncStatus === 'synced' ? (
            'All changes synced'
          ) : pendingCount > 0 ? (
            `${pendingCount} change${pendingCount > 1 ? 's' : ''} pending`
          ) : (
            'Back online'
          )}
        </span>
      </div>

      {syncStatus === 'syncing' && (
        <div className="w-24">
          <Progress value={syncProgress} className="h-1" />
        </div>
      )}

      {isOnline && pendingCount > 0 && syncStatus !== 'syncing' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncPendingActions}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync Now
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={dismiss}
        className="h-7 px-2 text-xs"
      >
        Dismiss
      </Button>
    </div>
  );
}

/**
 * Network Status Indicator
 * Simple icon showing online/offline status
 */
export function NetworkStatus({ showLabel = false, className }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          {showLabel && (
            <span className="text-xs text-green-600">Online</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-500" />
          {showLabel && (
            <span className="text-xs text-amber-600">Offline</span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Offline Queue Manager
 * Manages actions to be queued when offline
 */
export class OfflineQueue {
  constructor() {
    this.dbName = 'LocalRnkOfflineDB';
    this.storeName = 'actionQueue';
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async queue(action) {
    await this.init();
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    const item = {
      ...action,
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0
    };
    
    return store.add(item);
  }

  async getPending() {
    await this.init();
    const tx = this.db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const index = store.index('status');
    
    return index.getAll('pending');
  }

  async markCompleted(id) {
    await this.init();
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    const item = await store.get(id);
    if (item) {
      item.status = 'completed';
      item.completedAt = Date.now();
      await store.put(item);
    }
  }

  async markFailed(id, error) {
    await this.init();
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    
    const item = await store.get(id);
    if (item) {
      item.retryCount++;
      item.lastError = error;
      
      // Max 3 retries
      if (item.retryCount >= 3) {
        item.status = 'failed';
      }
      
      await store.put(item);
    }
  }

  async clearOld(days = 7) {
    await this.init();
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const index = store.index('timestamp');
    
    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

/**
 * Hook for offline-aware actions
 */
export function useOfflineAction() {
  const execute = useCallback(async (action, options = {}) => {
    const {
      onSuccess,
      onError,
      onQueued,
      retry = true
    } = options;

    // If online, execute immediately
    if (navigator.onLine) {
      try {
        const result = await action();
        onSuccess?.(result);
        return result;
      } catch (error) {
        if (retry && isNetworkError(error)) {
          // Queue for retry
          await offlineQueue.queue({ action: action.toString() });
          onQueued?.();
        } else {
          onError?.(error);
        }
        throw error;
      }
    }
    
    // Offline - queue the action
    await offlineQueue.queue({ action: action.toString() });
    onQueued?.();
    
    return { queued: true };
  }, []);

  return { execute };
}

function isNetworkError(error) {
  return (
    error.name === 'TypeError' ||
    error.message?.includes('network') ||
    error.message?.includes('fetch')
  );
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocalRnkSyncDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export default OfflineBanner;