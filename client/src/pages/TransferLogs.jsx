import React, { useState } from 'react';
import { Truck, CheckCircle2, Clock, Calendar, ArrowRight, Package } from 'lucide-react';

const TransferLogs = () => {
  const [transfers, setTransfers] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_transfers')) || [
      { id: 'tr1', date: '2026-07-12 01:30', from: 'الفرع الرئيسي - المهندسين', to: 'فرع مصر الجديدة', product: 'فستان سواريه مطرز', qty: 5, status: 'completed', receiveDate: '2026-07-12 14:00' }
    ];
  });

  const [filter, setFilter] = useState('all');

  const filteredTransfers = transfers.filter(tr => {
    if (filter === 'completed') return tr.status === 'completed';
    if (filter === 'pending') return tr.status === 'pending';
    return true;
  });

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>سجل الشحنات ونقل البضائع</h1>
          <p style={{ color: 'var(--text-muted)' }}>تفاصيل جميع عمليات نقل البضائع الصادرة والواردة بين فروع المحلات.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <select className="input-field" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
            <option value="all">عرض كل الشحنات</option>
            <option value="completed">تم الاستلام فقط</option>
            <option value="pending">في الطريق (معلقة)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الشحنة</th>
              <th>المنتج / البضاعة</th>
              <th>الكمية</th>
              <th>من فرع</th>
              <th>إلى فرع</th>
              <th>تاريخ الإرسال</th>
              <th>حالة الشحنة</th>
              <th>تاريخ الاستلام</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  لا توجد شحنات مطابقة للبحث.
                </td>
              </tr>
            ) : (
              filteredTransfers.map((tr) => (
                <tr key={tr.id}>
                  <td style={{ fontWeight: 'bold' }}>{tr.id.toUpperCase()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={16} className="text-primary" />
                      {tr.product}
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{tr.qty}</td>
                  <td>{tr.from}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: '600' }}>{tr.to}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {tr.date}
                    </div>
                  </td>
                  <td>
                    {tr.status === 'completed' ? (
                      <span className="badge success">
                        <CheckCircle2 size={14} style={{ marginLeft: '4px' }} />
                        تم الاستلام
                      </span>
                    ) : (
                      <span className="badge warning">
                        <Truck size={14} style={{ marginLeft: '4px' }} />
                        في الطريق
                      </span>
                    )}
                  </td>
                  <td>
                    {tr.status === 'completed' ? (
                      <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '13px' }}>
                        {tr.receiveDate || tr.date}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransferLogs;
