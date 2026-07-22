import React, { useState } from 'react';
import { Coins, Calendar, FileText, CheckCircle, ArrowUpDown, Printer, X } from 'lucide-react';

const CashierShift = () => {
  const user = JSON.parse(localStorage.getItem('mizan_user')) || { name: 'سارة أحمد' };

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [actualCashDrawer, setActualCashDrawer] = useState('');

  // Load shift details
  const openingCash = parseFloat(localStorage.getItem('mizan_opening_cash')) || 0;
  const shiftSales = parseFloat(localStorage.getItem('mizan_shift_sales')) || 0;
  const isShiftOpen = localStorage.getItem('mizan_shift_open') === 'true';

  // Load shift logs (history of closed shifts)
  const shiftLogs = JSON.parse(localStorage.getItem('mizan_shift_logs')) || [];

  // Load invoices to filter the ones issued by this cashier
  const salesHistory = JSON.parse(localStorage.getItem('mizan_sales_history')) || [
    { id: 'inv-1001', customer: 'أحمد محمود', customerPhone: '01122334455', date: '2026-07-12 01:10', items: [{ name: 'فستان سواريه مطرز', sellPrice: 850, qty: 1 }], subtotal: 850, discount: 0, total: 850, paymentMethod: 'كاش', cashier: 'سارة أحمد' }
  ];

  // Filter invoices for this cashier
  const myInvoices = salesHistory.filter(inv => inv.cashier === user.name);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'var(--font-ar)' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>خزنة الوردية والعمليات اليومية 💰</h1>
          <p style={{ color: 'var(--text-muted)' }}>مراقبة النقدية المتاحة بالدرج، حركة فواتير الكاشير، وسجل الورديات المقفلة.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCloseShiftModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Printer size={18} />
          <span>إنهاء الوردية وطباعة Z-Report</span>
        </button>
      </div>

      {/* Shift status card */}
      <div className="grid-cols-3 mb-24">
        <div className="card stat-card" style={{ borderColor: isShiftOpen ? 'var(--success)' : 'var(--danger)' }}>
          <div className="stat-info">
            <span className="stat-title">رصيد الدرج الافتتاحي</span>
            <span className="stat-value" style={{ color: 'var(--text-main)' }}>
              {openingCash.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isShiftOpen ? 'الشيفت الحالي نشط' : 'الشيفت مغلق'}
            </span>
          </div>
          <div className="stat-icon success">
            <Coins size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">مبيعات الوردية (الفعالة)</span>
            <span className="stat-value" style={{ color: 'var(--primary)' }}>
              {shiftSales.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مجموع مبيعات الكاشير الحالية</span>
          </div>
          <div className="stat-icon primary">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">الرصيد المتوقع بالدرج</span>
            <span className="stat-value" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              {(openingCash + shiftSales).toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مطابق لنقدية العهدة</span>
          </div>
          <div className="stat-icon success">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* My Shift Invoices */}
      <div className="card mb-24">
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} className="text-primary" />
          <span>سجل فواتير مبيعاتي بالشيفت الحالي ({myInvoices.length})</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>رقم الفاتورة</th>
                <th>التاريخ والوقت</th>
                <th>العميل</th>
                <th>طريقة الدفع</th>
                <th>قيمة المبيعات</th>
              </tr>
            </thead>
            <tbody>
              {myInvoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 'bold' }}>{inv.id}</td>
                  <td>{inv.date}</td>
                  <td>{inv.customer}</td>
                  <td>{inv.paymentMethod}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{inv.total.toLocaleString()} ج.م</td>
                </tr>
              ))}
              {myInvoices.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    لم تقم بإصدار أي فواتير مبيعات بالوردية الحالية بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashier Shift Closure Logs History */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} className="text-primary" />
          <span>سجل إغلاق الورديات السابقة للكاشير</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>تاريخ الإغلاق</th>
                <th>الكاشير</th>
                <th>رصيد الافتتاح</th>
                <th>رصيد المبيعات</th>
                <th>العجز والزيادة بالخزنة</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.date}</td>
                  <td>{log.cashier}</td>
                  <td>{log.openingCash} ج.م</td>
                  <td>{log.salesCash} ج.م</td>
                  <td style={{ fontWeight: 'bold', color: log.difference === 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {log.difference === 0 ? '✓ متطابق' : log.difference > 0 ? `فائض +${log.difference} ج.م` : `عجز ${log.difference} ج.م`}
                  </td>
                </tr>
              ))}
              {shiftLogs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    لا توجد سجلات تسوية ورديات سابقة مقفلة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Z-Report / Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>تقرير الإقفال (Z-Report)</h3>
              <X className="modal-close" onClick={() => setShowCloseShiftModal(false)} />
            </div>

            <div style={{ background: '#fff', color: '#000', padding: '20px', borderRadius: '8px', border: '1px dashed #ccc', fontFamily: 'monospace', margin: '16px 0', fontSize: '13px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '10px', marginBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>{localStorage.getItem('mizan_shop_name') || 'مِيزان للبيع والتوزيع'}</h2>
                <p style={{ margin: '4px 0' }}>تقرير نهاية الوردية Z-Report</p>
                <p style={{ margin: '4px 0' }}>الكاشير: {user.name}</p>
                <p style={{ margin: '4px 0' }}>التاريخ: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>رصيد الدرج الافتتاحي:</span>
                <span>{openingCash.toLocaleString()} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>مبيعات الوردية:</span>
                <span>{shiftSales.toLocaleString()} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>عدد الفواتير المصدرة:</span>
                <span>{myInvoices.length} فاتورة</span>
              </div>

              <div style={{ borderTop: '1px dashed #ccc', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
                <span>إجمالي النقدية المتوقعة بالدرج:</span>
                <span>{(openingCash + shiftSales).toLocaleString()} ج.م</span>
              </div>
            </div>

            <div className="form-group">
              <label>النقدية الفعلية الموجودة بالدرج (للمطابقة)</label>
              <input 
                type="number" 
                value={actualCashDrawer} 
                onChange={(e) => setActualCashDrawer(e.target.value)} 
                placeholder="أدخل المبلغ الفعلي الذي قمت بعدّه..." 
              />
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setShowCloseShiftModal(false)}>إلغاء</button>
              <button 
                className="btn btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  if (!actualCashDrawer) {
                    alert('الرجاء إدخال النقدية الفعلية للمطابقة!');
                    return;
                  }
                  const actual = parseFloat(actualCashDrawer) || 0;
                  const expected = openingCash + shiftSales;
                  const diff = actual - expected;

                  const log = {
                    id: 'shift-' + Date.now(),
                    date: new Date().toLocaleString('ar-EG'),
                    cashier: user.name,
                    openingCash,
                    salesCash: shiftSales,
                    actualCash: actual,
                    difference: diff
                  };

                  const updatedLogs = [log, ...shiftLogs];
                  localStorage.setItem('mizan_shift_logs', JSON.stringify(updatedLogs));
                  
                  // Reset shift
                  localStorage.setItem('mizan_shift_open', 'false');
                  localStorage.setItem('mizan_shift_sales', '0');
                  
                  window.print(); // Print the Z-Report

                  alert('تم إغلاق الوردية وحفظ التقرير بنجاح!');
                  window.location.reload();
                }}
              >
                <Printer size={16} />
                تأكيد وطباعة Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CashierShift;
