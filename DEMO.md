# 🎪 Madar ERP/POS — Public Demo Sandbox Environment

The **Madar Demo Environment** provides an isolated, production-grade sandbox where prospective users, clients, and QA testers can safely evaluate every module of Mizan/Madar ERP/POS without impacting production data.

---

## 👥 Demo Trial Accounts

| Role | Email | Password | Allowed Modules & Description |
| :--- | :--- | :--- | :--- |
| **👑 Owner** | `owner@demo.madar.app` | `Demo@123` | Full access to all ERP modules, executive dashboard, multi-branch, users, & settings |
| **🛡️ Admin** | `admin@demo.madar.app` | `Demo@123` | General administration, reports, logs, system settings |
| **🏢 Manager** | `manager@demo.madar.app` | `Demo@123` | Branch inventory, products, sales, stock transfers, & staff supervision |
| **📊 Accountant**| `accountant@demo.madar.app` | `Demo@123` | Treasury, bank accounts, journal entries (double-entry), expenses, & P&L |
| **💰 Cashier** | `cashier@demo.madar.app` | `Demo@123` | POS screen, active shift cash register, receipts, returns |
| **📦 Warehouse**| `warehouse@demo.madar.app` | `Demo@123` | Inter-branch transfers, stock count sessions, PO receiving |
| **🔍 Staff** | `staff@demo.madar.app` | `Demo@123` | Price checker, stock verification, and physical stocktakes |

---

## 🛡️ Sandbox Security & Multi-Tenant Isolation

1. **Dedicated Organization**: All demo records are strictly partitioned under the **`Madar Demo`** organization (`orgId`).
2. **Zero Cross-Tenant Leakage**: Queries for demo accounts cannot access or mutate real tenant accounts.
3. **Reset Mechanism**:
   - Automated server startup seed (`seedDemoEnvironment`).
   - On-demand reset API (`POST /api/v1/demo/reset`).
   - One-click reset button on the top demo banner.

---

## 🌐 Demo API Endpoints

- `GET /api/v1/demo/accounts` — Fetch available demo accounts & role descriptions.
- `GET /api/v1/demo/status` — Fetch sandbox status & reset policies.
- `POST /api/v1/demo/reset` — Reset only `Madar Demo` organization data.
- `GET /api/v1/demo/info` — Fetch public sandbox summary for landing pages.
