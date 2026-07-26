import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Sale from '../models/Sale.js';
import Shift from '../models/Shift.js';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Expense from '../models/Expense.js';
import BankAccount from '../models/BankAccount.js';
import TreasuryTransaction from '../models/TreasuryTransaction.js';
import JournalEntry from '../models/JournalEntry.js';
import StockTransfer from '../models/StockTransfer.js';
import StockCountSession from '../models/StockCountSession.js';
import Notification from '../models/Notification.js';

export const DEMO_ORG_NAME = 'Madar Demo';
export const DEMO_PASSWORD = 'Demo@123';

export const DEMO_ACCOUNTS = [
  { role: 'owner', name: 'طه أنس (المالك)', email: 'owner@demo.madar.app', title: '👑 مالك النظام (Owner)', desc: 'صلاحيات كاملة للتحكم بكافة الفروع والمبيعات والمالية' },
  { role: 'admin', name: 'المدير العام', email: 'admin@demo.madar.app', title: '🛡️ مدير النظام (Admin)', desc: 'صلاحيات الإدارة العامة وإعدادات المحل والتقارير' },
  { role: 'manager', name: 'مدير الفرع', email: 'manager@demo.madar.app', title: '🏢 مدير الفرع (Manager)', desc: 'إدارة مخزون الفرع، المبيعات والموظفين' },
  { role: 'accountant', name: 'المحاسب المالي', email: 'accountant@demo.madar.app', title: '📊 المحاسب (Accountant)', desc: 'إدارة الخزينة، القيود المزدوجة والمصروفات والبنك' },
  { role: 'cashier', name: 'سارة أحمد (كاشير)', email: 'cashier@demo.madar.app', title: '💰 الكاشير (Cashier)', desc: 'إصدار الفواتير السريعة ودرج النقدية وإغلاق الشفت' },
  { role: 'warehouse', name: 'أمين المخزن', email: 'warehouse@demo.madar.app', title: '📦 أمين المخزن (Warehouse)', desc: 'التحويلات بين الفروع، الجرد الدوري والمستلمات' },
  { role: 'staff', name: 'موظف جرد', email: 'staff@demo.madar.app', title: '🔍 موظف الجرد والأسعار (Staff)', desc: 'فحص الأسعار، كميات المخزن والجرد الميداني' }
];

export const seedDemoEnvironment = async () => {
  console.log('🔄 Initializing Madar Demo Environment Sandbox...');

  // 1. Create or fetch Demo Organization
  let org = await Organization.findOne({ name: DEMO_ORG_NAME });
  if (!org) {
    org = await Organization.create({
      name: DEMO_ORG_NAME,
      ownerName: 'طه أنس (مدار التجريبي)',
      phone: '01143632650',
      plan: 'pro',
      status: 'active',
      trialEndsAt: new Date('2030-01-01'),
      subscriptionExpiresAt: new Date('2030-01-01')
    });
    console.log('✅ Created Demo Organization:', org._id);
  }

  const orgId = org._id;

  // Clear previous demo records ONLY for DEMO_ORG_NAME
  await Promise.all([
    User.deleteMany({ orgId }),
    Branch.deleteMany({ orgId }),
    Product.deleteMany({ orgId }),
    Customer.deleteMany({ orgId }),
    Supplier.deleteMany({ orgId }),
    Sale.deleteMany({ orgId }),
    Shift.deleteMany({ orgId }),
    ExpenseCategory.deleteMany({ orgId }),
    Expense.deleteMany({ orgId }),
    BankAccount.deleteMany({ orgId }),
    TreasuryTransaction.deleteMany({ orgId }),
    JournalEntry.deleteMany({ orgId }),
    StockTransfer.deleteMany({ orgId }),
    StockCountSession.deleteMany({ orgId }),
    Notification.deleteMany({ orgId })
  ]);

  // 2. Create Demo Branches
  const bMain = await Branch.create({ name: 'الفرع الرئيسي - القاهرة', orgId, code: 'BR-MAIN', isMain: true });
  const bAlex = await Branch.create({ name: 'فرع الإسكندرية', orgId, code: 'BR-ALEX', isMain: false });

  // 3. Create Demo Users
  const userMap = {};
  for (const acc of DEMO_ACCOUNTS) {
    const user = await User.create({
      name: acc.name,
      email: acc.email,
      password: DEMO_PASSWORD,
      role: acc.role,
      orgId,
      branchId: bMain._id,
      status: 'active'
    });
    userMap[acc.role] = user;
  }

  // 4. Create Demo Categories & Products
  const prod1 = await Product.create({
    orgId,
    name: 'فستان سواريه حرير مطرز',
    sku: 'DEMO-PROD-01',
    barcode: '62210001111',
    category: 'فساتين',
    costPrice: 450,
    sellPrice: 850,
    wholesalePrice: 650,
    stock: 25,
    minStock: 5,
    unit: 'قطعة',
    branchId: bMain._id
  });

  const prod2 = await Product.create({
    orgId,
    name: 'بلوزة شيفون صيفي كاجوال',
    sku: 'DEMO-PROD-02',
    barcode: '62210002222',
    category: 'بلوزات',
    costPrice: 180,
    sellPrice: 350,
    wholesalePrice: 260,
    stock: 40,
    minStock: 8,
    unit: 'قطعة',
    branchId: bMain._id
  });

  const prod3 = await Product.create({
    orgId,
    name: 'جيب بليسيه أسود',
    sku: 'DEMO-PROD-03',
    barcode: '62210003333',
    category: 'جيبات',
    costPrice: 220,
    sellPrice: 420,
    wholesalePrice: 310,
    stock: 15,
    minStock: 3,
    unit: 'قطعة',
    branchId: bMain._id
  });

  // 5. Create Demo Customers & Suppliers
  const cust1 = await Customer.create({
    orgId,
    name: 'أحمد محمود العبد',
    phone: '01122334455',
    email: 'ahmed@gmail.com',
    balance: 1200,
    loyaltyPoints: 340
  });

  const supp1 = await Supplier.create({
    orgId,
    name: 'شركة النيل للمنسوجات والملابس',
    company: 'شركة النيل للمنسوجات والملابس',
    phone: '01001122334',
    contactPerson: 'المهندس طارق',
    balance: 8500
  });

  // 6. Create Demo Shift & Sale
  const shift = await Shift.create({
    orgId,
    branchId: bMain._id,
    userId: userMap.cashier._id,
    shiftNumber: 'SHIFT-DEMO-001',
    openingCash: 500,
    expectedCash: 1350,
    actualCash: 1350,
    difference: 0,
    totalSales: 850,
    totalInvoices: 1,
    status: 'OPEN',
    openedAt: new Date()
  });

  await Sale.create({
    orgId,
    invoiceNumber: 'INV-DEMO-1001',
    branchId: bMain._id,
    customerId: cust1._id,
    shiftId: shift._id,
    items: [
      { productId: prod1._id, name: prod1.name, unit: 'قطعة', quantity: 1, unitPrice: 850, discount: 0, total: 850 }
    ],
    payments: [{ method: 'CASH', amount: 850 }],
    subtotal: 850,
    discount: 0,
    tax: 0,
    totalAmount: 850,
    paidAmount: 850,
    dueAmount: 0,
    status: 'COMPLETED',
    cashierId: userMap.cashier._id,
    createdBy: userMap.cashier._id
  });

  // 7. Create Demo Expenses & Bank Account
  const expCat = await ExpenseCategory.create({ orgId, name: 'فواتير ومنافع', description: 'كهرباء ومياه وإنترنت' });
  await Expense.create({
    orgId,
    branchId: bMain._id,
    categoryId: expCat._id,
    amount: 350,
    paymentMethod: 'CASH',
    notes: 'سداد فاتورة كهرباء المحل الرئيسي',
    expenseDate: new Date(),
    createdBy: userMap.accountant._id
  });

  const bank = await BankAccount.create({
    orgId,
    bankName: 'البنك الأهلي المصري',
    accountName: 'حساب مدار للتجارة',
    accountNumber: '1234567890',
    balance: 75000,
    currency: 'EGP',
    status: 'ACTIVE'
  });

  await TreasuryTransaction.create({
    orgId,
    type: 'BANK_DEPOSIT',
    direction: 'IN',
    amount: 75000,
    balanceAfter: 75000,
    paymentMethod: 'TRANSFER',
    bankAccountId: bank._id,
    notes: 'إيداع افتتاحي بالحساب البنكي',
    createdBy: userMap.accountant._id
  });

  await JournalEntry.create({
    orgId,
    entryNumber: 'JE-DEMO-000001',
    entryDate: new Date(),
    totalDebit: 75000,
    totalCredit: 75000,
    status: 'POSTED',
    items: [
      { accountCode: '1002', accountName: 'البنك الأهلي', debit: 75000, credit: 0 },
      { accountCode: '3001', accountName: 'رأس المال', debit: 0, credit: 75000 }
    ],
    createdBy: userMap.accountant._id
  });

  // 8. Create Demo Notifications
  await Notification.create({
    orgId,
    title: 'مرحباً بك في بيئة مدار التجريبية! 🚀',
    message: 'يمكنك تجربة جميع الموديولات وإصدار الفواتير وإعادة ضبط البيانات بأمان في أي وقت.',
    type: 'SYSTEM',
    priority: 'HIGH'
  });

  console.log('🎉 Madar Demo Environment seeded successfully!');
  return { org, userMap };
};
