# 🚀 Orbion ERP — Enterprise Retail & POS Platform

Production-Ready, Enterprise-Grade Multi-Tenant Cloud ERP/POS Platform for Retail, Apparel, Boutiques, Supermarkets, and Wholesale Businesses.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose ORM, JWT Strategy with Refresh Token Rotation, Zod Validation, Helmet, Morgan, Winston Logger.
- **Frontend**: React 19, Vite, TanStack React Query (v5), Axios Client, Recharts, Lucide Icons, RTL Arabic Localization.
- **Database**: MongoDB Atlas / Self-Hosted MongoDB 7.0 (100% Mongoose ORM, Multi-Tenant `orgId` Partitioning).
- **Containerization & Infra**: Docker, Docker Compose, Nginx, GitHub Actions CI/CD Pipeline.

---

## 🏛️ System Architecture & ERP Modules

1. **Authentication API** (`/api/v1/auth`) — Multi-Tenant Organization Registration, User Login, JWT Cookie Strategy, Refresh Token Rotation.
2. **Products API** (`/api/v1/products`) — Category Management, Multi-Industry Specs (Clothing, Supermarket, Wholesale), Barcode Generator & Scanner, CSV Bulk Import, Stock Adjustment.
3. **Inventory & Warehouse API** (`/api/v1/inventory`) — Branch Transfers, Stock Count Sessions, Bulk Stock Adjustment, Low/Out-of-Stock Audit.
4. **Customers & Suppliers API** (`/api/v1/customers`, `/api/v1/suppliers`) — Debtor & Creditor Account Ledgers, Settlement Workflows, Loyalty Points Engine.
5. **Purchase Orders API** (`/api/v1/purchase-orders`) — Supplier PO Creation, Approval, Receiving Check-In, Inventory Increments.
6. **Sales & POS API** (`/api/v1/sales`) — High-Speed Cashier POS, Split Payment Methods (`CASH`, `CARD`, `INSTAPAY`, `DEBT`), Customer Account Credit, Held Sales, Returns & Refunds.
7. **Shift & Cash Register API** (`/api/v1/shifts`) — Open/Close Shift Lifecycle, Expected Cash Calculation, Cash Reconciliation (Short/Over), Z-Report Summaries.
8. **Finance & Accounting API** (`/api/v1/finance`) — Operating Expenses, Bank Accounts & Transfers, Cash Receipts/Payouts, Double-Entry General Ledger (`JournalEntry`), Income Statement (P&L), Cash Flow.
9. **Executive Dashboard API** (`/api/v1/dashboard`) — Executive Overview KPIs, Sales Analytics, Product & Customer Intelligence, Ready-to-render Charts API.
10. **Workflow, Approvals & Audit API** (`/api/v1/workflow`) — Real-time Notifications, Multi-Tier Approval Engine, Audit Trail with Field-Level Diffs, Background Job Scheduler.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **MongoDB**: Local MongoDB on `mongodb://localhost:27017/mizan` or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
node seed.js # Seeds default owner & cashier accounts
npm start
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

Open browser at `http://localhost:5173/`

- **Default Owner Login**: `owner@mizan.com` / `01143632650taha`
- **Default Cashier Login**: `cashier@mizan.com` / `01143632650taha`

---

## 🐳 Docker Deployment

### 1. Development Environment
```bash
docker-compose up --build -d
```

### 2. Production Environment
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 🧪 Integration Testing & Verification

Run backend integration test suites:
```bash
cd server
node test-auth.js
node test-products.js
node test-inventory.js
node test-customers.js
node test-suppliers.js
node test-sales.js
node test-shifts.js
node test-finance.js
node test-dashboard.js
node test-workflow.js
```

---

## 📄 License
Commercial Enterprise License — Mizan ERP/POS Systems.
