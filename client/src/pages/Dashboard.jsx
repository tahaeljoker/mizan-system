import React from 'react';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { invoices, products } from '../data/mockData';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // Calculate some numbers from mock data
  const totalSales = invoices.reduce((acc, inv) => inv.status === 'completed' ? acc + inv.total : acc, 0);
  const refundedSales = invoices.reduce((acc, inv) => inv.status === 'refunded' ? acc + inv.total : acc, 0);
  const activeInvoicesCount = invoices.filter(inv => inv.status === 'completed').length;
  
  // Find low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Hardcoded sales data for charts
  const salesHistory = [
    { name: 'السبت', sales: 4200, profit: 1600 },
    { name: 'الأحد', sales: 5100, profit: 2100 },
    { name: 'الاثنين', sales: 4800, profit: 1900 },
    { name: 'الثلاثاء', sales: 6300, profit: 2800 },
    { name: 'الأربعاء', sales: 7200, profit: 3100 },
    { name: 'الخميس', sales: 8500, profit: 3900 },
    { name: 'الجمعة', sales: 9100, profit: 4200 },
  ];

  const topProducts = [
    { name: 'فساتين', value: 45 },
    { name: 'بلوزات', value: 38 },
    { name: 'بناطيل', value: 29 },
    { name: 'جيب', value: 18 },
  ];

  const COLORS = ['var(--primary)', 'var(--secondary)', '#f59e0b', '#10b981'];

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>لوحة التحكم العامة</h1>
          <p style={{ color: 'var(--text-muted)' }}>مرحباً بك مجدداً! إليك نظرة سريعة على أداء محلك اليوم.</p>
        </div>
        <Link to="/pos" className="btn btn-primary">
          <Plus size={18} />
          <span>كاشير جديد (POS)</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">مبيعات اليوم</span>
            <span className="stat-value">{totalSales.toLocaleString()} ج.م</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>+12.5% عن الأسبوع الماضي</span>
            </div>
          </div>
          <div className="stat-icon primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">عدد فواتير اليوم</span>
            <span className="stat-value">{activeInvoicesCount} فواتير</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>+4 فواتير نشطة</span>
            </div>
          </div>
          <div className="stat-icon secondary">
            <FileText size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">صافي الأرباح المقدرة</span>
            <span className="stat-value">1,120 ج.م</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>+8.2% هامش الربح اليوم</span>
            </div>
          </div>
          <div className="stat-icon success">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">منتجات بحاجة لشحن</span>
            <span className="stat-value" style={{ color: lowStockProducts.length > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
              {lowStockProducts.length} منتجات
            </span>
            <div className="stat-trend down" style={{ color: 'var(--text-muted)' }}>
              <span>مستويات المخزون حرجة</span>
            </div>
          </div>
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>مخطط المبيعات والأرباح (الأسبوع الحالي)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-main)',
                    textAlign: 'right'
                  }} 
                />
                <Line type="monotone" dataKey="sales" stroke="var(--primary)" name="المبيعات" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="profit" stroke="var(--success)" name="الأرباح" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>توزيع المبيعات حسب القسم</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-main)',
                    textAlign: 'right'
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock & Invoices */}
      <div className="grid-cols-3">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="flex justify-between align-center mb-24">
            <h3 style={{ fontSize: '18px' }}>آخر العمليات والفواتير</h3>
            <Link to="/reports" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>عرض كل الفواتير</Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>العميل</th>
                  <th>التاريخ</th>
                  <th>طريقة الدفع</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{inv.id}</td>
                    <td>{inv.customer}</td>
                    <td>{inv.date}</td>
                    <td>{inv.paymentMethod}</td>
                    <td style={{ fontWeight: '600' }}>{inv.total} ج.م</td>
                    <td>
                      <span className={`badge ${inv.status === 'completed' ? 'success' : 'danger'}`}>
                        {inv.status === 'completed' ? 'ناجحة' : 'مرتجع'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>تنبيهات نواقص المخزن</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex align-center justify-between" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{p.name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>الباركود: {p.barcode}</p>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'var(--danger)', fontWeight: '700', fontSize: '16px' }}>{p.stock} {p.unit}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الحد الأدنى: {p.minStock}</span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                لا توجد منتجات ناقصة بالمخزن حالياً 🎉
              </div>
            )}
            <Link to="/inventory" className="btn btn-secondary w-full" style={{ marginTop: '8px' }}>
              إدارة كميات المخزن
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
