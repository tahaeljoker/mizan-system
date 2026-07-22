import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  Download, 
  DollarSign, 
  Percent, 
  Layers 
} from 'lucide-react';
import { invoices } from '../data/mockData';

const Reports = () => {
  const [dateRange, setDateRange] = useState('today');

  // Load cashier shift logs from localStorage or mock defaults
  const [shiftLogs, setShiftLogs] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_shift_logs')) || [
      { id: 'mock-s1', date: '2026-07-12 01:15', cashier: 'سارة أحمد', openingCash: 500, salesCash: 850, expectedCash: 1350, actualCash: 1350, difference: 0 },
      { id: 'mock-s2', date: '2026-07-11 23:30', cashier: 'كريم محمود', openingCash: 500, salesCash: 1200, expectedCash: 1700, actualCash: 1680, difference: -20 }
    ];
  });

  // Hardcoded sales summary for demo
  const stats = {
    revenue: 12500,
    profit: 5200,
    ordersCount: 15,
    averageBill: 833,
    discountApplied: 450
  };

  // Payment methods chart data
  const paymentData = [
    { name: 'كاش', value: 7500 },
    { name: 'كارت', value: 3000 },
    { name: 'انستا باي', value: 2000 }
  ];

  // Category sales data
  const categorySalesData = [
    { name: 'فساتين', sales: 18500 },
    { name: 'بلوزات', sales: 8400 },
    { name: 'جيبات', sales: 5200 },
    { name: 'بنطلونات', sales: 6900 },
    { name: 'إكسسوارات', sales: 1200 }
  ];

  const COLORS = ['#6366f1', '#8b5cf6', '#10b981'];

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>التقارير والمؤشرات المالية</h1>
          <p style={{ color: 'var(--text-muted)' }}>تحليل شامل للمبيعات، الأرباح، أداء الفروع وطرق التحصيل.</p>
        </div>
        <div className="flex gap-8">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '150px', padding: '10px' }}
          >
            <option value="today">اليوم</option>
            <option value="yesterday">أمس</option>
            <option value="week">آخر 7 أيام</option>
            <option value="month">الشهر الحالي</option>
            <option value="year">العام الحالي</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={18} />
            <span>تحميل تقرير مفصل (PDF)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي المبيعات (الإيرادات)</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--primary)' }}>
              {stats.revenue.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>+14.2% مقارنة بالفترة السابقة</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>صافي الأرباح</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--success)' }}>
              {stats.profit.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>هامش ربح تقريبي: 41.6%</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>متوسط قيمة الفاتورة</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold' }}>
              {stats.averageBill.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>عدد الفواتير الكلي: {stats.ordersCount}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>قيمة الخصومات الممنوحة</span>
            <span style={{ fontSize: '26px', fontWeight: 'bold', color: 'var(--danger)' }}>
              {stats.discountApplied.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>أكواد خصم وتخفيضات يدوية</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-cols-2">
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>حجم المبيعات حسب فئات المنتجات</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-main)', textAlign: 'right' }} />
                <Bar dataKey="sales" fill="var(--primary)" name="المبيعات (ج.م)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>طرق التحصيل والدفع المالي</h3>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '220px', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-main)', textAlign: 'right' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '30px' }}>
              {paymentData.map((d, index) => (
                <div key={index} className="flex align-center gap-8">
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[index] }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{d.name}:</span>
                  <strong style={{ fontSize: '14px' }}>{d.value.toLocaleString()} ج.م</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff and Branches Sales tables */}
      <div className="grid-cols-2">
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>أداء مبيعات الموظفين (الكاشير)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الموظف</th>
                  <th>عدد الفواتير</th>
                  <th>متوسط الخصم</th>
                  <th>إجمالي التحصيل</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>سارة أحمد</td>
                  <td>12 فاتورة</td>
                  <td>12.5 ج.م</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>9,550 ج.م</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>كريم محمود</td>
                  <td>3 فواتير</td>
                  <td>20 ج.م</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>2,950 ج.م</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>أداء الفروع ونسب المبيعات</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الفرع</th>
                  <th>إجمالي المبيعات</th>
                  <th>عدد الفواتير</th>
                  <th>النسبة من الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600' }}>الفرع الرئيسي - المهندسين</td>
                  <td style={{ fontWeight: 'bold' }}>10,500 ج.م</td>
                  <td>13 فاتورة</td>
                  <td>
                    <span className="badge info">84%</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>فرع مصر الجديدة</td>
                  <td style={{ fontWeight: 'bold' }}>2,000 ج.م</td>
                  <td>2 فاتورة</td>
                  <td>
                    <span className="badge warning">16%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cashier Shift Matching reports */}
      <div className="card mb-24" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} className="text-primary" />
          <span>سجلات تسوية ورديات الكاشير ومطابقة الخزينة</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>تاريخ إغلاق الوردية</th>
                <th>اسم الكاشير</th>
                <th>رصيد البداية (الدرج)</th>
                <th>مبيعات الشيفت الكاش</th>
                <th>المبلغ المتوقع بالخزينة</th>
                <th>المبلغ الفعلي المستلم</th>
                <th>الفارق والعجز والزيادة</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: '500' }}>{log.date}</td>
                  <td style={{ fontWeight: '600' }}>{log.cashier}</td>
                  <td>{log.openingCash.toLocaleString()} ج.م</td>
                  <td>{log.salesCash.toLocaleString()} ج.م</td>
                  <td style={{ fontWeight: 'bold' }}>{log.expectedCash.toLocaleString()} ج.م</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{log.actualCash.toLocaleString()} ج.م</td>
                  <td style={{ 
                    fontWeight: 'bold', 
                    color: log.difference === 0 ? 'var(--success)' : log.difference > 0 ? 'var(--info)' : 'var(--danger)' 
                  }}>
                    {log.difference === 0 
                      ? '✓ متطابق' 
                      : log.difference > 0 
                        ? `+${log.difference} ج.م (زيادة)` 
                        : `${log.difference} ج.م (عجز)`
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
