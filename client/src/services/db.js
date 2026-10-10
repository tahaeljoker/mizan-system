/**
 * Orbion ERP — Offline POS IndexedDB Storage Layer
 * Native, zero-dependency Promise wrapper around window.indexedDB.
 */

const DB_NAME = 'orbion_pos_db';
const DB_VERSION = 1;

let dbPromise = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      console.error('IndexedDB is not supported in this browser.');
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Products Store
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'productId' });
        prodStore.createIndex('barcode', 'barcode', { unique: false });
        prodStore.createIndex('sku', 'sku', { unique: false });
        prodStore.createIndex('name', 'name', { unique: false });
      }

      // 2. Customers Store
      if (!db.objectStoreNames.contains('customers')) {
        const custStore = db.createObjectStore('customers', { keyPath: 'customerId' });
        custStore.createIndex('phone', 'phone', { unique: false });
        custStore.createIndex('name', 'name', { unique: false });
      }

      // 3. Pending Sales Queue Store
      if (!db.objectStoreNames.contains('pendingSales')) {
        const saleStore = db.createObjectStore('pendingSales', { keyPath: 'id' });
        saleStore.createIndex('clientRequestId', 'clientRequestId', { unique: true });
        saleStore.createIndex('status', 'status', { unique: false });
        saleStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 4. Metadata Store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
};

// Helper: Generic transaction runner
const withStore = async (storeName, mode, callback) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result = null;

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);

    result = callback(store);
  });
};

/* ==========================================================================
   PRODUCTS CACHE
   ========================================================================== */

export const cacheProducts = async (products) => {
  if (!Array.isArray(products) || products.length === 0) return;

  const db = await initDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');

  products.forEach(p => {
    const productId = (p._id || p.id || p.productId)?.toString();
    if (!productId) return;

    store.put({
      productId,
      name: p.name || '',
      barcode: p.barcode || '',
      alternateBarcodes: Array.isArray(p.alternateBarcodes) ? p.alternateBarcodes : [],
      sku: p.sku || '',
      code: p.code || '',
      sellPrice: Number(p.sellPrice || 0),
      costPrice: Number(p.costPrice || 0),
      stock: Number(p.stock || 0),
      unit: p.unit || 'قطعة',
      category: p.category || 'عام',
      brand: p.brand || '',
      updatedAt: new Date().toISOString()
    });
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedProducts = async () => {
  return withStore('products', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
};

export const updateCachedProductStock = async (productId, deltaQty) => {
  const db = await initDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');

  return new Promise((resolve, reject) => {
    const getReq = store.get(productId);
    getReq.onsuccess = () => {
      const prod = getReq.result;
      if (prod) {
        prod.stock = Math.max(0, prod.stock + deltaQty);
        store.put(prod);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

/* ==========================================================================
   CUSTOMERS CACHE
   ========================================================================== */

export const cacheCustomers = async (customers) => {
  if (!Array.isArray(customers) || customers.length === 0) return;

  const db = await initDB();
  const tx = db.transaction('customers', 'readwrite');
  const store = tx.objectStore('customers');

  customers.forEach(c => {
    const customerId = (c._id || c.id || c.customerId)?.toString();
    if (!customerId) return;

    store.put({
      customerId,
      name: c.name || '',
      phone: c.phone || '',
      balance: Number(c.balance || 0),
      loyaltyPoints: Number(c.loyaltyPoints || 0),
      updatedAt: new Date().toISOString()
    });
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedCustomers = async () => {
  return withStore('customers', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
};

/* ==========================================================================
   PENDING SALES QUEUE
   ========================================================================== */

export const addPendingSale = async (saleData) => {
  const db = await initDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');

  const pendingRecord = {
    id: saleData.id || `pending_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    clientRequestId: saleData.clientRequestId || crypto.randomUUID(),
    invoiceNumber: saleData.invoiceNumber || `OFFLINE-${Date.now().toString().slice(-6)}`,
    payload: saleData.payload,
    displayInvoice: saleData.displayInvoice,
    status: 'pending_sync', // 'pending_sync', 'syncing', 'synced', 'sync_failed'
    createdAt: new Date().toISOString(),
    attempts: 0,
    nextRetryAt: Date.now(),
    lastError: null
  };

  return new Promise((resolve, reject) => {
    const req = store.add(pendingRecord);
    req.onsuccess = () => resolve(pendingRecord);
    req.onerror = () => reject(req.error);
  });
};

export const getPendingSales = async () => {
  return withStore('pendingSales', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        resolve(list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      };
      req.onerror = () => reject(req.error);
    });
  });
};

export const updatePendingSaleStatus = async (id, updates) => {
  const db = await initDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');

  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) return resolve(null);

      const updated = { ...record, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deletePendingSale = async (id) => {
  const db = await initDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  const store = tx.objectStore('pendingSales');

  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/* ==========================================================================
   METADATA STORE
   ========================================================================== */

export const setMetadata = async (key, value) => {
  return withStore('metadata', 'readwrite', (store) => {
    store.put({ key, value, updatedAt: new Date().toISOString() });
  });
};

export const getMetadata = async (key) => {
  return withStore('metadata', 'readonly', (store) => {
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  });
};
