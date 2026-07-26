import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Wallet,
  Building2
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
import { Link } from 'react-router-dom';
import apiService from '../services/api';

const Dashboard = () => {
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => apiService.dashboard.getOverview({ period: 'today' }),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: charts, isLoading: loadingCharts } = useQuery({
    queryKey: ['dashboardCharts'],
    queryFn: () => apiService.dashboard.getCharts({ period: 'this_month' })
  });

  const { data: recentSales } = useQuery({
    queryKey: ['recentSales'],
    queryFn: () => apiService.sales.getAll({ limit: 5 })
  });

  const salesHistory = charts?.salesLineChart?.length ? charts.salesLineChart : [
    { date: 'اليوم', revenue: overview?.todayRevenue || 0, invoices: overview?.todaySalesCount || 0 }
  ];

  const topProductsChart = charts?.topProductsBarChart?.length ? charts.topProductsBarChart.map(p => ({
    name: p.name,
    value: p.quantity
  })) : [
    { name: 'لا توجد مبيعات بعد', value: 1 }
  ];

  const COLORS = ['var(--primary)', 'var(--secondary)', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', color: 'var(--text-main)' }}>لوحة التحكم التنفيذية (Executive Dashboard)</h1>
          <p style={{ color: 'var(--text-muted)' }}>مرحباً بك! إليك النظرة الشاملة المباشرة على أداء المحل والمبيعات والمخزون.</p>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={() => refetchOverview()}>
            <RefreshCw size={18} />
            <span>تحديث المباشر</span>
          </button>
          <Link to="/pos" className="btn btn-primary">
            <Plus size={18} />
            <span>كاشير جديد (POS)</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-cols-4">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">مبيعات اليوم</span>
            <span className="stat-value">{(overview?.todayRevenue || 0).toLocaleString()} ج.م</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>فواتير اليوم: {overview?.todaySalesCount || 0}</span>
            </div>
          </div>
          <div className="stat-icon primary">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">مبيعات الشهر الحالي</span>
            <span className="stat-value">{(overview?.monthRevenue || 0).toLocaleString()} ج.م</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>صافي أرباح الشهر: {(overview?.monthProfit || 0).toLocaleString()} ج.م</span>
            </div>
          </div>
          <div className="stat-icon secondary">
            <FileText size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">صافي أرباح اليوم المقدرة</span>
            <span className="stat-value">{(overview?.todayProfit || 0).toLocaleString()} ج.م</span>
            <div className="stat-trend up">
              <ArrowUpRight size={14} />
              <span>مجمل الربح: {(overview?.grossProfit || 0).toLocaleString()} ج.م</span>
            </div>
          </div>
          <div className="stat-icon success">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">قيمة بضاعة المخزن (سعر البيع)</span>
            <span className="stat-value">{(overview?.inventoryValue || 0).toLocaleString()} ج.م</span>
            <div className="stat-trend down" style={{ color: 'var(--text-muted)' }}>
              <span>تكلفة الشراء: {(overview?.stockCost || 0).toLocaleString()} ج.م</span>
            </div>
          </div>
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Financial Liquidity Summary */}
      <div className="grid-cols-4 mb-24">
        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">رصيد الخزينة النقدية (الكاش)</span>
            <span className="stat-value">{(overview?.cashBalance || 0).toLocaleString()} ج.م</span>
          </div>
          <div className="stat-icon primary">
            <Wallet size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">إجمالي الأرصدة البنكية</span>
            <span className="stat-value">{(overview?.bankBalance || 0).toLocaleString()} ج.م</span>
          </div>
          <div className="stat-icon secondary">
            <Building2 size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">ديون للعملاء (Receivables)</span>
            <span className="stat-value">{(overview?.receivables || 0).toLocaleString()} ج.م</span>
          </div>
          <div className="stat-icon warning">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">مستحقات للموردين (Payables)</span>
            <span className="stat-value">{(overview?.payables || 0).toLocaleString()} ج.م</span>
          </div>
          <div className="stat-icon danger">
            <FileText size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-cols-3 mb-24">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>مخطط مبيعات الفترات الزمني المباشر</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    borderColor: 'var(--border)', 
                    color: 'var(--text-main)',
                    textAlign: 'right'
                  }} 
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" name="المبيعات (ج.م)" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>المنتجات الأكثر مبيعاً</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProductsChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {topProductsChart.map((entry, index) => (
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

      {/* Recent Sales Table */}
      <div className="card">
        <div className="flex justify-between align-center mb-24">
          <h3 style={{ fontSize: '18px' }}>آخر الفواتير والعمليات المباشرة</h3>
          <Link to="/reports" style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: '600' }}>عرض كل الفواتير</Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ</th>
                <th>إجمالي المبلغ</th>
                <th>طريقة الدفع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recentSales?.sales?.length > 0 ? (
                recentSales.sales.map((sale) => (
                  <tr key={sale._id}>
                    <td style={{ fontWeight: 'bold' }}>{sale.invoiceNumber}</td>
                    <td>{new Date(sale.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td style={{ fontWeight: 'bold' }}>{(sale.totalAmount || 0).toLocaleString()} ج.م</td>
                    <td>{sale.payments?.[0]?.method || 'CASH'}</td>
                    <td>
                      <span className={`badge badge-${sale.status === 'COMPLETED' ? 'success' : 'danger'}`}>
                        {sale.status === 'COMPLETED' ? 'مكتملة' : sale.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد فواتير مسجلة حتى الآن</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
