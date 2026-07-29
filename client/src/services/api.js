import axios from 'axios';

// API Base URL configuration:
// 1. Primary: import.meta.env.VITE_API_URL (set via Vercel / environment)
// 2. Dev mode fallback: http://localhost:5000/api/v1 (during npm run dev)
// 3. Production fallback: https://mizan-system-production.up.railway.app/api/v1 (on Vercel deployment)
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : 'https://mizan-system-production.up.railway.app/api/v1');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mizan_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for 401 Unauthorized auto-logout & global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or auth checks
      const isAuthEndpoint = error.config && (
        error.config.url.includes('/auth/login') || 
        error.config.url.includes('/auth/me')
      );
      if (!isAuthEndpoint) {
        localStorage.removeItem('mizan_token');
        localStorage.removeItem('mizan_user');
      }
    }
    return Promise.reject(error);
  }
);

const apiService = {
  // 1. Auth & Session
  auth: {
    login: async (email, password) => {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('mizan_token', response.data.token);
        localStorage.setItem('mizan_user', JSON.stringify(response.data.user));
      }
      return response.data;
    },
    register: async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch (e) {
        console.warn('Logout endpoint failed:', e.message);
      } finally {
        localStorage.removeItem('mizan_token');
        localStorage.removeItem('mizan_user');
      }
    },
    getMe: async () => {
      const response = await api.get('/auth/me');
      return response.data.user;
    },
    refreshToken: async () => {
      const response = await api.post('/auth/refresh');
      if (response.data.token) {
        localStorage.setItem('mizan_token', response.data.token);
      }
      return response.data;
    }
  },

  // 2. SaaS & Organizations
  saas: {
    registerCompany: async (companyData) => {
      const response = await api.post('/saas/register', companyData);
      return response.data;
    },
    getSubscription: async () => {
      const response = await api.get('/saas/subscription');
      return response.data.subscription;
    },
    upgradePlan: async (planCode, billingCycle) => {
      const response = await api.post('/saas/upgrade', { planCode, billingCycle });
      return response.data;
    },
    getWhiteLabel: async () => {
      const response = await api.get('/saas/whitelabel');
      return response.data.config;
    },
    resetDemoData: async () => {
      const response = await api.post('/demo/reset');
      return response.data;
    },
    getInfo: async () => {
      const response = await api.get('/demo/info');
      return response.data;
    }
  },

  // 3. Products
  products: {
    getAll: async (params) => {
      const response = await api.get('/products', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/products/${id}`);
      return response.data.product;
    },
    create: async (data) => {
      const response = await api.post('/products', data);
      return response.data.product;
    },
    update: async (id, data) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data.product;
    },
    delete: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    bulkImport: async (products) => {
      const response = await api.post('/products/bulk-import', { products });
      return response.data;
    },
    adjustStock: async (id, quantity, type, reason) => {
      const response = await api.patch(`/products/${id}/stock`, { quantity, type, reason });
      return response.data;
    },
    searchBarcode: async (barcode) => {
      const response = await api.get(`/products/barcode/${barcode}`);
      return response.data.product;
    }
  },

  // 4. Customers
  customers: {
    getAll: async (params) => {
      const response = await api.get('/customers', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/customers/${id}`);
      return response.data.customer;
    },
    create: async (data) => {
      const response = await api.post('/customers', data);
      return response.data.customer;
    },
    update: async (id, data) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data.customer;
    },
    delete: async (id) => {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    },
    getLedger: async (id, params) => {
      const response = await api.get(`/customers/${id}/ledger`, { params });
      return response.data;
    },
    settleBalance: async (id, data) => {
      const response = await api.post(`/customers/${id}/settle`, data);
      return response.data;
    }
  },

  // 5. Suppliers
  suppliers: {
    getAll: async (params) => {
      const response = await api.get('/suppliers', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/suppliers/${id}`);
      return response.data.supplier;
    },
    create: async (data) => {
      const response = await api.post('/suppliers', data);
      return response.data.supplier;
    },
    update: async (id, data) => {
      const response = await api.put(`/suppliers/${id}`, data);
      return response.data.supplier;
    },
    delete: async (id) => {
      const response = await api.delete(`/suppliers/${id}`);
      return response.data;
    },
    getLedger: async (id, params) => {
      const response = await api.get(`/suppliers/${id}/ledger`, { params });
      return response.data;
    },
    settleBalance: async (id, data) => {
      const response = await api.post(`/suppliers/${id}/settle`, data);
      return response.data;
    }
  },

  // 6. Purchase Orders
  purchaseOrders: {
    getAll: async (params) => {
      const response = await api.get('/purchase-orders', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/purchase-orders/${id}`);
      return response.data.purchaseOrder;
    },
    create: async (data) => {
      const response = await api.post('/purchase-orders', data);
      return response.data.purchaseOrder;
    },
    update: async (id, data) => {
      const response = await api.put(`/purchase-orders/${id}`, data);
      return response.data.purchaseOrder;
    },
    approve: async (id) => {
      const response = await api.post(`/purchase-orders/${id}/approve`);
      return response.data.purchaseOrder;
    },
    receive: async (id, data) => {
      const response = await api.post(`/purchase-orders/${id}/receive`, data);
      return response.data.purchaseOrder;
    },
    cancel: async (id, reason) => {
      const response = await api.post(`/purchase-orders/${id}/cancel`, { reason });
      return response.data.purchaseOrder;
    }
  },

  // 7. Sales & POS
  sales: {
    getAll: async (params) => {
      const response = await api.get('/sales', { params });
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/sales/${id}`);
      return response.data.sale;
    },
    getByInvoiceNumber: async (invoiceNumber) => {
      const response = await api.get(`/sales/invoice/${invoiceNumber}`);
      return response.data.sale;
    },
    create: async (data) => {
      const response = await api.post('/sales', data);
      return response.data;
    },
    hold: async (data) => {
      const response = await api.post('/sales/hold', data);
      return response.data;
    },
    resume: async (id, data) => {
      const response = await api.post(`/sales/${id}/resume`, data);
      return response.data;
    },
    refund: async (id, data) => {
      const response = await api.post(`/sales/${id}/refund`, data);
      return response.data;
    },
    cancel: async (id, reason) => {
      const response = await api.patch(`/sales/${id}/cancel`, { reason });
      return response.data;
    },
    getHistory: async (params) => {
      const response = await api.get('/sales/history', { params });
      return response.data;
    },
    getDailySummary: async (params) => {
      const response = await api.get('/sales/daily-summary', { params });
      return response.data.summary;
    }
  },

  // 8. Shifts & Cash Registers
  shifts: {
    getAll: async (params) => {
      const response = await api.get('/shifts', { params });
      return response.data;
    },
    getCurrent: async () => {
      const response = await api.get('/shifts/current');
      return response.data.shift;
    },
    getById: async (id) => {
      const response = await api.get(`/shifts/${id}`);
      return response.data.shift;
    },
    open: async (data) => {
      const response = await api.post('/shifts/open', data);
      return response.data.shift;
    },
    close: async (id, data) => {
      const response = await api.post(`/shifts/${id}/close`, data);
      return response.data.shift;
    },
    getDailyReport: async (params) => {
      const response = await api.get('/shifts/daily-report', { params });
      return response.data.report;
    }
  },

  // 9. Inventory & Warehouse
  inventory: {
    getTransfers: async (params) => {
      const response = await api.get('/inventory/transfers', { params });
      return response.data;
    },
    getTransferById: async (id) => {
      const response = await api.get(`/inventory/transfers/${id}`);
      return response.data.transfer;
    },
    createTransfer: async (data) => {
      const response = await api.post('/inventory/transfers', data);
      return response.data.transfer;
    },
    dispatchTransfer: async (id) => {
      const response = await api.post(`/inventory/transfers/${id}/dispatch`);
      return response.data.transfer;
    },
    receiveTransfer: async (id, data) => {
      const response = await api.post(`/inventory/transfers/${id}/receive`, data);
      return response.data.transfer;
    },
    cancelTransfer: async (id, reason) => {
      const response = await api.post(`/inventory/transfers/${id}/cancel`, { reason });
      return response.data.transfer;
    },
    getStockCounts: async (params) => {
      const response = await api.get('/inventory/sessions', { params });
      return response.data;
    },
    getStockCountById: async (id) => {
      const response = await api.get(`/inventory/sessions/${id}`);
      return response.data.session;
    },
    createStockCount: async (data) => {
      const response = await api.post('/inventory/stock-count', data);
      return response.data.session;
    },
    startStockCount: async (id) => {
      const response = await api.post(`/inventory/stock-count/${id}/start`);
      return response.data.session;
    },
    submitStockCount: async (id, data) => {
      const response = await api.post(`/inventory/stock-count/${id}/submit`, data);
      return response.data.session;
    },
    approveStockCount: async (id) => {
      const response = await api.post(`/inventory/stock-count/${id}/approve`);
      return response.data.session;
    },
    bulkAdjust: async (adjustments) => {
      const response = await api.patch('/inventory/bulk-adjust', adjustments);
      return response.data;
    },
    getLowStock: async (params) => {
      const response = await api.get('/inventory/low-stock', { params });
      return response.data;
    },
    getOutOfStock: async (params) => {
      const response = await api.get('/inventory/out-of-stock', { params });
      return response.data;
    },
    getReport: async (params) => {
      const response = await api.get('/inventory/report', { params });
      return response.data.report;
    }
  },

  // 10. Finance & Accounting
  finance: {
    getExpenseCategories: async () => {
      const response = await api.get('/finance/expense-categories');
      return response.data.categories || [];
    },
    createExpenseCategory: async (data) => {
      const response = await api.post('/finance/expense-categories', data);
      return response.data.category;
    },
    getExpenses: async (params) => {
      const response = await api.get('/finance/expenses', { params });
      return response.data;
    },
    getExpenseById: async (id) => {
      const response = await api.get(`/finance/expenses/${id}`);
      return response.data.expense;
    },
    createExpense: async (data) => {
      const response = await api.post('/finance/expenses', data);
      return response.data.expense;
    },
    updateExpense: async (id, data) => {
      const response = await api.put(`/finance/expenses/${id}`, data);
      return response.data.expense;
    },
    deleteExpense: async (id) => {
      const response = await api.delete(`/finance/expenses/${id}`);
      return response.data;
    },
    getTreasuryBalance: async () => {
      const response = await api.get('/finance/treasury/balance');
      return response.data.treasury;
    },
    getTreasuryTransactions: async (params) => {
      const response = await api.get('/finance/treasury/transactions', { params });
      return response.data;
    },
    cashIn: async (data) => {
      const response = await api.post('/finance/treasury/cash-in', data);
      return response.data.transaction;
    },
    cashOut: async (data) => {
      const response = await api.post('/finance/treasury/cash-out', data);
      return response.data.transaction;
    },
    getBankAccounts: async () => {
      const response = await api.get('/finance/banks');
      return response.data.accounts || [];
    },
    createBankAccount: async (data) => {
      const response = await api.post('/finance/banks', data);
      return response.data.account;
    },
    depositBank: async (id, data) => {
      const response = await api.post(`/finance/banks/${id}/deposit`, data);
      return response.data.account;
    },
    withdrawBank: async (id, data) => {
      const response = await api.post(`/finance/banks/${id}/withdraw`, data);
      return response.data.account;
    },
    transferBanks: async (data) => {
      const response = await api.post('/finance/banks/transfer', data);
      return response.data;
    },
    recordCustomerPayment: async (data) => {
      const response = await api.post('/finance/customer-payments', data);
      return response.data;
    },
    recordSupplierPayment: async (data) => {
      const response = await api.post('/finance/supplier-payments', data);
      return response.data;
    },
    getJournalEntries: async (params) => {
      const response = await api.get('/finance/journal-entries', { params });
      return response.data;
    },
    createJournalEntry: async (data) => {
      const response = await api.post('/finance/journal-entries', data);
      return response.data.entry;
    },
    getGeneralLedger: async (params) => {
      const response = await api.get('/finance/ledger', { params });
      return response.data.ledger;
    },
    getTrialBalance: async (params) => {
      const response = await api.get('/finance/trial-balance', { params });
      return response.data.trialBalance;
    },
    getChartOfAccounts: async (params) => {
      const response = await api.get('/finance/chart-of-accounts', { params });
      return response.data.accounts;
    },
    getDashboard: async (params) => {
      const response = await api.get('/finance/dashboard', { params });
      return response.data.dashboard;
    },
    getProfitLoss: async (params) => {
      const response = await api.get('/finance/profit-loss', { params });
      return response.data.report;
    },
    getCashFlow: async (params) => {
      const response = await api.get('/finance/cash-flow', { params });
      return response.data.report;
    },
    getExpenseReport: async (params) => {
      const response = await api.get('/finance/expense-report', { params });
      return response.data.report;
    }
  },

  // 11. Executive Dashboard & Analytics
  dashboard: {
    getOverview: async (params) => {
      const response = await api.get('/dashboard/overview', { params });
      return response.data.overview;
    },
    getSales: async (params) => {
      const response = await api.get('/dashboard/sales', { params });
      return response.data.sales;
    },
    getProducts: async (params) => {
      const response = await api.get('/dashboard/products', { params });
      return response.data.products;
    },
    getCustomers: async (params) => {
      const response = await api.get('/dashboard/customers', { params });
      return response.data.customers;
    },
    getInventory: async (params) => {
      const response = await api.get('/dashboard/inventory', { params });
      return response.data.inventory;
    },
    getFinance: async (params) => {
      const response = await api.get('/dashboard/finance', { params });
      return response.data.finance;
    },
    getCashiers: async (params) => {
      const response = await api.get('/dashboard/cashiers', { params });
      return response.data.cashiers;
    },
    getBranches: async (params) => {
      const response = await api.get('/dashboard/branches', { params });
      return response.data.branches;
    },
    getCharts: async (params) => {
      const response = await api.get('/dashboard/charts', { params });
      return response.data.charts;
    }
  },

  // 12. Workflow (Notifications, Approvals, Audit & Jobs)
  workflow: {
    getNotifications: async (params) => {
      const response = await api.get('/notifications', { params });
      return response.data;
    },
    getUnreadCount: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data.unreadCount || 0;
    },
    markRead: async (id) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data.notification;
    },
    markAllRead: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    },
    deleteNotification: async (id) => {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    },
    getApprovalRequests: async (params) => {
      const response = await api.get('/approvals', { params });
      return response.data;
    },
    approveRequest: async (id, comment) => {
      const response = await api.post(`/approvals/${id}/approve`, { comment });
      return response.data.request;
    },
    rejectRequest: async (id, reason) => {
      const response = await api.post(`/approvals/${id}/reject`, { reason });
      return response.data.request;
    },
    getAuditLogs: async (params) => {
      const response = await api.get('/audit-logs', { params });
      return response.data;
    },
    getJobLogs: async (params) => {
      const response = await api.get('/job-logs', { params });
      return response.data;
    }
  }
};

export default apiService;
