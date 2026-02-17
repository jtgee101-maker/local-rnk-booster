/**
 * Service Worker Registration Module
 * Handles SW registration, updates, and communication
 */

import { Workbox } from 'workbox-window';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SW');

let wb = null;
let isUpdateAvailable = false;
let refreshing = false;

/**
 * Register the service worker
 * @returns {Promise<Workbox|null>}
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    logger.debug('Service workers not supported');
    return null;
  }

  // Prevent double registration
  if (wb) {
    return wb;
  }

  try {
    wb = new Workbox('/sw.js');

    // Handle updates
    wb.addEventListener('waiting', (event) => {
      logger.debug('New version waiting');
      isUpdateAvailable = true;
      showUpdateToast();
    });

    // Handle controlling (new version activated)
    wb.addEventListener('controlling', (event) => {
      if (refreshing) {
        return;
      }
      
      logger.debug('New version controlling');
      
      // Reload to use new version
      if (event.isUpdate) {
        window.location.reload();
      }
    });

    // Handle external waiting (from other tabs)
    wb.addEventListener('externalwaiting', (event) => {
      showUpdateToast();
    });

    // Handle messages from SW
    wb.addEventListener('message', (event) => {
      handleSWMessage(event.data);
    });

    // Register
    await wb.register();
    logger.debug('Registered successfully');

    // Check for updates periodically
    startUpdateChecks();

    return wb;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Show update available toast
 */
function showUpdateToast() {
  toast.info('Update Available', {
    description: 'A new version of LocalRnk is ready',
    duration: 0,
    action: {
      label: 'Update Now',
      onClick: () => skipWaitingAndReload()
    },
    secondaryAction: {
      label: 'Later',
      onClick: () => logger.debug('Update postponed')
    }
  });
}

/**
 * Skip waiting and reload
 */
export function skipWaitingAndReload() {
  if (!wb) return;
  
  refreshing = true;
  
  // Send skip waiting message to SW
  wb.messageSkipWaiting();
  
  toast.success('Updating...', {
    description: 'Refreshing to new version'
  });
}

/**
 * Check for updates manually
 */
export async function checkForUpdates() {
  if (!wb) {
    toast.error('Service Worker not registered');
    return false;
  }

  try {
    await wb.update();
    
    if (isUpdateAvailable) {
      return true;
    }
    
    toast.success('App is up to date');
    return false;
  } catch (error) {
    logger.error('Update check failed:', error);
    toast.error('Failed to check for updates');
    return false;
  }
}

/**
 * Get service worker version
 */
export async function getSWVersion() {
  if (!wb) return null;
  
  try {
    const messageChannel = new MessageChannel();
    const versionPromise = new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.version);
      };
    });
    
    wb.messageSW({ type: 'GET_VERSION' }, messageChannel.port2);
    return await versionPromise;
  } catch (error) {
    logger.error('Failed to get version:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
    logger.debug('Unregistered all');
    toast.success('Service Worker unregistered');
  } catch (error) {
    logger.error('Unregister failed:', error);
    toast.error('Failed to unregister');
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  if (!wb) {
    toast.error('Service Worker not available');
    return;
  }
  
  try {
    wb.messageSW({ type: 'CLEAR_CACHE' });
    toast.success('Caches cleared');
  } catch (error) {
    logger.error('Cache clear failed:', error);
    toast.error('Failed to clear caches');
  }
}

/**
 * Precache specific URLs
 */
export async function precacheUrls(urls) {
  if (!wb) {
    toast.error('Service Worker not available');
    return;
  }
  
  try {
    wb.messageSW({ type: 'PRECACHE_URLS', payload: { urls } });
    toast.success(`Precaching ${urls.length} URLs...`);
  } catch (error) {
    logger.error('Precache failed:', error);
    toast.error('Failed to precache');
  }
}

/**
 * Start periodic update checks
 */
function startUpdateChecks() {
  // Check every 5 minutes when tab is active
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      wb?.update();
    }
  }, 5 * 60 * 1000);

  // Check on window focus
  window.addEventListener('focus', () => {
    wb?.update();
  });
}

/**
 * Handle messages from service worker
 */
function handleSWMessage({ type, data }) {
  switch (type) {
    case 'sync-complete':
      toast.success('Sync complete', {
        description: 'Offline changes synchronized'
      });
      break;
      
    case 'cache-cleared':
      toast.success('Cache cleared successfully');
      break;
      
    case 'precache-complete':
      toast.success(`Precached ${data.count} resources`);
      break;
      
    case 'offline-ready':
      toast.success('App ready for offline use');
      break;
  }
}

/**
 * Get service worker status
 */
export function getSWStatus() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, registered: false };
  }
  
  return {
    supported: true,
    registered: !!wb,
    updateAvailable: isUpdateAvailable
  };
}

/**
 * Initialize service worker on app load
 * Call this in your main entry file
 */
export function initServiceWorker() {
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW_IN_DEV) {
    logger.debug('Disabled in dev mode');
    return Promise.resolve(null);
  }
  
  return registerServiceWorker();
}

export default {
  register: registerServiceWorker,
  update: checkForUpdates,
  skipWaiting: skipWaitingAndReload,
  unregister: unregisterServiceWorker,
  clearCaches: clearAllCaches,
  precache: precacheUrls,
  getVersion: getSWVersion,
  getStatus: getSWStatus,
  init: initServiceWorker
};
