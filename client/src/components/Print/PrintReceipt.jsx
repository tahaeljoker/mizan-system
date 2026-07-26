import React from 'react';
import { Printer, X } from 'lucide-react';

const PrintReceipt = ({ sale, onClose, format = 'thermal' }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const isThermal = format === 'thermal';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--font-ar)'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        maxWidth: isThermal ? '380px' : '750px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        direction: 'rtl',
        position: 'relative'
      }}>
        {/* Action Header */}
        <div className="no-print flex justify-between align-center mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Printer size={16} />
            <span>طباعة الآن ({isThermal ? 'إيصال 80mm' : 'فاتورة A4'})</span>
          </button>
          <X size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        {/* Printable Content */}
        <div id="printable-area" style={{ fontFamily: 'monospace, var(--font-ar)', fontSize: isThermal ? '12px' : '14px', lineHeight: '1.5' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: isThermal ? '18px' : '22px', fontWeight: 'bold', margin: '0 0 4px 0' }}>مِدار ERP/POS</h2>
            <p style={{ margin: 0, color: '#555', fontSize: '11px' }}>فاتورة ضريبية مبسطة | رقم: {sale.invoiceNumber || 'INV-1001'}</p>
            <p style={{ margin: '2px 0 0 0', color: '#777', fontSize: '10px' }}>التاريخ: {new Date(sale.createdAt || Date.now()).toLocaleString('ar-EG')}</p>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', margin: '12px 0' }}>
            <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '4px 0' }}>الصنف</th>
                  <th style={{ padding: '4px 0', textAlign: 'center' }}>الكمية</th>
                  <th style={{ padding: '4px 0', textAlign: 'left' }}>السعر</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '4px 0' }}>{item.name || item.productId?.name || 'صنف'}</td>
                    <td style={{ padding: '4px 0', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '4px 0', textAlign: 'left' }}>{(item.unitPrice * item.quantity).toFixed(2)} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>الإجمالي الفرعي:</span>
              <span>{(sale.subtotal || sale.totalAmount || 0).toFixed(2)} ج.م</span>
            </div>
            {sale.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>الخصم:</span>
                <span>-{sale.discount.toFixed(2)} ج.م</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '4px', marginTop: '4px' }}>
              <span>الإجمالي النهائي:</span>
              <span>{(sale.totalAmount || 0).toFixed(2)} ج.م</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#666' }}>
            <p style={{ margin: '0 0 4px 0' }}>شكراً لتسوقكم معنا!</p>
            <p style={{ margin: 0 }}>www.madar.app</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
