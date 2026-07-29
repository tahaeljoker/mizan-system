import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Calendar, FileText, CheckCircle, Printer, X } from 'lucide-react';
import apiService from '../services/api';

const CashierShift = () => {
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('mizan_user')) || { name: 'المستخدم' };

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [actualCashDrawer, setActualCashDrawer] = useState('');
  const [closingNotes, setClosingNotes] = useState('');

  // 1. Fetch current active shift
  const { data: currentShift, isLoading: loadingCurrentShift } = useQuery({
    queryKey: ['currentShift'],
    queryFn: () => apiService.shifts.getCurrent()
  });

  // 2. Fetch shift history logs
  const { data: shiftHistoryData } = useQuery({
    queryKey: ['shiftHistory'],
    queryFn: () => apiService.shifts.getAll()
  });

  const shiftLogs = shiftHistoryData?.shifts || shiftHistoryData || [];

  // Mutations
  const openShiftMutation = useMutation({
    mutationFn: (data) => apiService.shifts.open(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
      queryClient.invalidateQueries({ queryKey: ['shiftHistory'] });
      setShowOpenShiftModal(false);
      alert('تم فتح وردية جديدة بنجاح! 🎉');
    },
    onError: (err) => {
      alert('حدث خطأ أثناء فتح الوردية: ' + (err.response?.data?.message || err.message));
    }
  });

  const closeShiftMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.shifts.close(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentShift'] });
      queryClient.invalidateQueries({ queryKey: ['shiftHistory'] });
      setShowCloseShiftModal(false);
      alert('تم إغلاق الوردية وحفظ تقرير الزيادة والعجز بنجاح! ✅');
    },
    onError: (err) => {
      alert('حدث خطأ في إغلاق الوردية: ' + (err.response?.data?.message || err.message));
    }
  });

  const isShiftOpen = !!currentShift;
  const openingCash = currentShift?.openingCash || 0;
  const shiftSales = currentShift?.totalSales || 0;

  const handleOpenShiftSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(openingCashInput) || 0;
    openShiftMutation.mutate({ openingCash: amount });
  };

  const handleCloseShiftSubmit = (e) => {
    e.preventDefault();
    if (!currentShift) return;

    const actual = parseFloat(actualCashDrawer) || 0;
    closeShiftMutation.mutate({
      id: currentShift._id || currentShift.id,
      data: {
        actualCash: actual,
        notes: closingNotes
      }
    });
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>خزنة الوردية والعمليات اليومية 💰</h1>
          <p style={{ color: 'var(--text-muted)' }}>مراقبة النقدية المتاحة بالدرج، حركة فواتير الكاشير، وسجل الورديات المقفلة.</p>
        </div>
        {isShiftOpen ? (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCloseShiftModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={18} />
            <span>إغلاق الوردية وطباعة Z-Report</span>
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowOpenShiftModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Coins size={18} />
            <span>فتح وردية كاشير جديدة</span>
          </button>
        )}
      </div>

      {/* Shift Status Cards */}
      <div className="grid-cols-3 mb-24">
        <div className="card stat-card" style={{ borderColor: isShiftOpen ? 'var(--success)' : 'var(--danger)' }}>
          <div className="stat-info">
            <span className="stat-title">رصيد الدرج الافتتاحي</span>
            <span className="stat-value" style={{ color: 'var(--text-main)' }}>
              {openingCash.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isShiftOpen ? `وردية رقم: ${currentShift?.shiftNumber || 'نشطة'}` : 'الوردية مغلقة'}
            </span>
          </div>
          <div className="stat-icon success">
            <Coins size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">إجمالي مبيعات الوردية</span>
            <span className="stat-value" style={{ color: 'var(--primary)' }}>
              {shiftSales.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>عدد الفواتير: {currentShift?.totalInvoices || 0}</span>
          </div>
          <div className="stat-icon primary">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">الرصيد المتوقع بالدرج</span>
            <span className="stat-value" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              {(currentShift?.expectedCash || (openingCash + shiftSales)).toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>افتتاحي + كاش مبيعات</span>
          </div>
          <div className="stat-icon success">
            <Coins size={24} />
          </div>
        </div>
      </div>

      {/* Shift History Table */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={20} className="text-primary" />
          <span>سجل إغلاق الورديات السابقة</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>رقم الوردية</th>
                <th>الكاشير</th>
                <th>تاريخ الفتح والإغلاق</th>
                <th>رصيد الافتتاح</th>
                <th>المبيعات والتسويات</th>
                <th>الفرق (عجز / زيادة)</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {shiftLogs.length > 0 ? (
                shiftLogs.map((log) => (
                  <tr key={log._id || log.id}>
                    <td style={{ fontWeight: 'bold' }}>{log.shiftNumber || log._id}</td>
                    <td>{log.userId?.name || user.name}</td>
                    <td>
                      <div>{new Date(log.openedAt || log.createdAt).toLocaleDateString('ar-EG')}</div>
                      {log.closedAt && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إغلاق: {new Date(log.closedAt).toLocaleTimeString('ar-EG')}</div>}
                    </td>
                    <td>{(log.openingCash || 0).toLocaleString()} ج.م</td>
                    <td>{(log.totalSales || 0).toLocaleString()} ج.م</td>
                    <td style={{ fontWeight: 'bold', color: (log.difference || 0) < 0 ? 'var(--danger)' : (log.difference || 0) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                      {(log.difference || 0) > 0 ? `+${log.difference}` : log.difference || 0} ج.م
                    </td>
                    <td>
                      <span className={`badge badge-${log.status === 'OPEN' ? 'warning' : 'success'}`}>
                        {log.status === 'OPEN' ? 'مفتوحة' : 'مغلقة'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد ورديات مسجلة سابقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>فتح وردية كاشير جديدة 🚀</h3>
              <button className="close-btn" onClick={() => setShowOpenShiftModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleOpenShiftSubmit}>
              <div className="form-group mb-16">
                <label className="form-label">العهدية / رصيد بداية الوردية بالنقدية (ج.م) *</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="مثال: 500"
                  required
                />
              </div>
              <div className="flex gap-12 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOpenShiftModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تأكيد وفتح الوردية</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>إغلاق الوردية وجرد النقدية بالدرج 🏁</h3>
              <button className="close-btn" onClick={() => setShowCloseShiftModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseShiftSubmit}>
              <div className="p-12 mb-16" style={{ background: 'var(--bg-app)', borderRadius: '8px' }}>
                <p><strong>الرصيد المتوقع بالدرج:</strong> {(currentShift?.expectedCash || (openingCash + shiftSales)).toLocaleString()} ج.م</p>
              </div>
              <div className="form-group mb-16">
                <label className="form-label">النقدية الفعلية الموجودة بالدرج الآن (ج.م) *</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={actualCashDrawer}
                  onChange={(e) => setActualCashDrawer(e.target.value)}
                  placeholder="أدخل المبلغ بعد العد اليدوي"
                  required
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">ملاحظات الإغلاق (اختياري)</label>
                <textarea 
                  className="form-control"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-12 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCloseShiftModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }}>تأكيد إغلاق الوردية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierShift;
