/**
 * Orbion ERP — Offline Sync Engine
 * Synchronizes pending offline POS sales with the backend when online.
 * Features:
 * - Multi-tab lock via Web Locks API
 * - Exponential backoff retry strategy
 * - Strict clientRequestId preservation for P0.5 idempotency
 * - Custom event notifications for UI responsiveness
 */

import { getPendingSales, updatePendingSaleStatus, deletePendingSale } from './db.js';
import apiService from './api.js';

const RETRY_SCHEDULE = [
  5 * 1000,       // 5 sec
  15 * 1000,      // 15 sec
  30 * 1000,      // 30 sec
  60 * 1000,      // 1 min
  5 * 60 * 1000,  // 5 min
  15 * 60 * 1000  // 15 min
];

const getNextRetryDelay = (attempts) => {
  const index = Math.min(attempts, RETRY_SCHEDULE.length - 1);
  return RETRY_SCHEDULE[index];
};

let isSyncing = false;
let syncTimer = null;

const notifySyncStatus = (status, details = {}) => {
  window.dispatchEvent(new CustomEvent('pos_sync_status_changed', {
    detail: { status, timestamp: Date.now(), ...details }
  }));
};

/**
 * Main Sync Function wrapped in Multi-Tab Lock
 */
export const processPendingSyncQueue = async () => {
  if (isSyncing) return;
  if (!navigator.onLine) {
    notifySyncStatus('OFFLINE');
    return;
  }

  // Multi-Tab Lock Protection via Web Locks API
  if (navigator.locks) {
    await navigator.locks.request('orbion_pos_sync_lock', { ifAvailable: true }, async (lock) => {
      if (!lock) {
        console.log('[SyncEngine] Another browser tab is currently holding the sync lock.');
        return;
      }
      await executeSyncLoop();
    });
  } else {
    await executeSyncLoop();
  }
};

const executeSyncLoop = async () => {
  try {
    isSyncing = true;
    const pendingItems = await getPendingSales();
    const readyItems = pendingItems.filter(item => {
      if (item.status === 'synced') return false;
      if (item.status === 'sync_failed' && item.nextRetryAt && Date.now() < item.nextRetryAt) return false;
      return true;
    });

    if (readyItems.length === 0) {
      isSyncing = false;
      notifySyncStatus('SYNC_COMPLETE', { count: 0 });
      return;
    }

    notifySyncStatus('SYNCING', { pendingCount: readyItems.length });

    for (const item of readyItems) {
      if (!navigator.onLine) {
        notifySyncStatus('OFFLINE');
        break;
      }

      // Mark local item as syncing
      await updatePendingSaleStatus(item.id, { status: 'syncing' });

      try {
        // Build payload ensuring original clientRequestId is preserved
        const payloadWithIdempotency = {
          ...item.payload,
          clientRequestId: item.clientRequestId
        };

        // Send POST request to backend API
        const res = await apiService.sales.create(payloadWithIdempotency);

        // Mark as synced on 200/201 response
        await updatePendingSaleStatus(item.id, {
          status: 'synced',
          syncedAt: new Date().toISOString(),
          serverSaleId: res?.sale?._id || res?._id || null
        });

        // Optionally clean up synced sale from store after 24h
        setTimeout(() => deletePendingSale(item.id).catch(() => {}), 24 * 3600 * 1000);

        window.dispatchEvent(new CustomEvent('pos_sale_synced', {
          detail: { pendingId: item.id, serverSale: res }
        }));

      } catch (err) {
        const isNetworkOrServerError = !err.response || (err.response.status >= 500 && err.response.status <= 599);
        const attempts = (item.attempts || 0) + 1;

        if (isNetworkOrServerError) {
          // Retryable Error: calculate exponential backoff delay
          const delay = getNextRetryDelay(attempts);
          const nextRetryAt = Date.now() + delay;

          await updatePendingSaleStatus(item.id, {
            status: 'pending_sync',
            attempts,
            nextRetryAt,
            lastError: err.message || 'Network timeout or server error'
          });

          notifySyncStatus('SYNC_RETRYING', { itemId: item.id, attempts, nextRetryInMs: delay });

        } else {
          // 4xx Validation / Business Error: mark sync_failed requiring manual resolution
          await updatePendingSaleStatus(item.id, {
            status: 'sync_failed',
            attempts,
            nextRetryAt: null,
            lastError: err.response?.data?.message || err.message || 'Validation or business error'
          });

          notifySyncStatus('SYNC_ERROR', { itemId: item.id, error: err.message });
        }
      }
    }
  } catch (globalErr) {
    console.error('[SyncEngine] Error in sync loop:', globalErr);
  } finally {
    isSyncing = false;
    const remaining = await getPendingSales();
    const remainingPending = remaining.filter(i => i.status !== 'synced');
    
    if (remainingPending.length === 0) {
      notifySyncStatus('SYNC_COMPLETE', { count: 0 });
    } else {
      notifySyncStatus('PENDING_ITEMS', { count: remainingPending.length });
    }
  }
};

/**
 * Initialize Sync Engine Listeners and Background Interval
 */
export const initSyncEngine = () => {
  // Listen for online network events
  window.addEventListener('online', () => {
    console.log('[SyncEngine] Network connection restored. Triggering sync...');
    processPendingSyncQueue();
  });

  // Background check interval (every 30 seconds)
  if (!syncTimer) {
    syncTimer = setInterval(() => {
      if (navigator.onLine) {
        processPendingSyncQueue();
      }
    }, 30 * 1000);
  }

  // Trigger initial check
  if (navigator.onLine) {
    processPendingSyncQueue();
  }
};
