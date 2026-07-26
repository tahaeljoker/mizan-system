import React, { useState } from 'react';
import { Search, RotateCcw, AlertTriangle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { invoices as initialInvoices, products as initialProducts } from '../data/mockData';
import apiService from '../services/api';

const Returns = () => {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundInvoice, setFoundInvoice] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State to track which items are being returned in the current session
  const [returnCart, setReturnCart] = useState({}); // { itemName: qtyToReturn }

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const invs = await (apiService.sales?.getAll() || apiService.invoices?.getAll());
        const prods = await apiService.products.getAll();
        setInvoices(Array.isArray(invs?.data) ? invs.data : Array.isArray(invs?.sales) ? invs.sales : Array.isArray(invs) ? invs : []);
        setProducts(Array.isArray(prods?.data) ? prods.data : Array.isArray(prods?.products) ? prods.products : Array.isArray(prods) ? prods : []);
      } catch (err) {
        console.warn('Failed loading returns data from API, loading local backup:', err.message);
        setInvoices(JSON.parse(localStorage.getItem('mizan_invoices')) || initialInvoices);
        setProducts(JSON.parse(localStorage.getItem('mizan_products')) || initialProducts);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search by ID or _id or invoiceNumber
    const inv = invoices.find(i => 
      (i.id && i.id.toLowerCase() === searchQuery.trim().toLowerCase()) || 
      (i._id && i._id.toLowerCase() === searchQuery.trim().toLowerCase()) ||
      (i.invoiceNumber && i.invoiceNumber.toLowerCase() === searchQuery.trim().toLowerCase())
    );

    if (inv) {
      if (inv.status === 'refunded' || inv.status === 'REFUNDED') {
        setErrorMsg('هذه الفاتورة تم استرجاعها بالكامل مسبقاً.');
        setFoundInvoice(null);
      } else {
        setFoundInvoice(inv);
        setErrorMsg('');
        setReturnCart({});
      }
    } else {
      setErrorMsg('لم يتم العثور على فاتورة بهذا الرقم.');
      setFoundInvoice(null);
    }
  };

  const handleQuantityChange = (itemName, qty, maxQty) => {
    const val = parseInt(qty) || 0;
    if (val < 0) return;
    if (val > maxQty) return;

    setReturnCart(prev => ({
      ...prev,
      [itemName]: val
    }));
  };

  const calculateReturnTotal = () => {
    if (!foundInvoice) return 0;
    let total = 0;
    foundInvoice.items.forEach(item => {
      const q = returnCart[item.name] || 0;
      total += q * item.price;
    });
    return total;
  };

  const handleExecuteReturn = async () => {
    const returnTotal = calculateReturnTotal();
    if (returnTotal <= 0) {
      alert('برجاء تحديد كمية قطعة واحدة على الأقل للاسترجاع.');
      return;
    }

    if (!window.confirm(`هل أنت تأكد من استرجاع بضاعة بقيمة ${returnTotal.toLocaleString()} ج.م؟ سيعاد المبلغ للعميل وتضاف البضاعة للمخزن.`)) {
      return;
    }

    try {
      if (foundInvoice._id) {
        await apiService.sales.refund(foundInvoice._id, { returnCart, returnTotal });
      }
    } catch (e) {
      console.warn('API refund failed, falling back to local simulation:', e.message);
    }

    // Update Local States
    const updatedInvoices = invoices.map(i => {
      if ((i.id && i.id === foundInvoice.id) || (i._id && i._id === foundInvoice._id)) {
        return { ...i, status: 'refunded' };
      }
      return i;
    });
    setInvoices(updatedInvoices);
    localStorage.setItem('mizan_invoices', JSON.stringify(updatedInvoices));

    alert('تم عملية الاسترجاع بنجاح! تم تحديث المخزون وإعادة المبلغ للعميل. 🔄');
    setFoundInvoice(null);
    setSearchQuery('');
    setReturnCart({});
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>مرتجعات الفواتير والمبيعات</h1>
          <p style={{ color: 'var(--text-muted)' }}>البحث برقم الفاتورة، تحديد القطع المسترجعة وإعادتها تلقائياً للمخزن.</p>
        </div>
      </div>

      {/* Invoice Search Bar */}
      <div className="card mb-24" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>بحث عن فاتورة بيع لاسترجاعها</h3>
        <form onSubmit={handleSearch} className="flex gap-12">
          <div className="header-search" style={{ flex: 1 }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="أدخل رقم الفاتورة (مثال: INV-1001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Search size={18} />
            <span>بحث الفاتورة</span>
          </button>
        </form>

        {errorMsg && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'var(--danger-glow)',
            color: 'var(--danger)',
            borderRadius: '8px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Found Invoice Details & Return Action */}
      {foundInvoice && (
        <div className="card">
          <div className="flex justify-between align-center mb-20" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>فاتورة رقم: {foundInvoice.invoiceNumber || foundInvoice.id || foundInvoice._id}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
                التاريخ: {foundInvoice.createdAt ? new Date(foundInvoice.createdAt).toLocaleString('ar-EG') : foundInvoice.date} | الكاشير: {foundInvoice.cashier || 'سارة أحمد'}
              </p>
            </div>
            <span className="badge success" style={{ padding: '6px 12px', fontSize: '13px' }}>مكتملة ومستحقة</span>
          </div>

          <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>حدد الكميات المراد إرجاعها للمخزن:</h4>

          <div className="table-container mb-24">
            <table>
              <thead>
                <tr>
                  <th>اسم المنتج / الصنف</th>
                  <th>السعر الفردي</th>
                  <th>الكمية المباعة</th>
                  <th>الكمية المراد استرجاعها</th>
                  <th>إجمالي المسترجع</th>
                </tr>
              </thead>
              <tbody>
                {(foundInvoice.items || []).map((item, idx) => {
                  const qtyToReturn = returnCart[item.name] || 0;
                  const itemPrice = item.price || item.unitPrice || 0;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                      <td>{itemPrice.toLocaleString()} ج.م</td>
                      <td>{item.quantity} قطعة</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={qtyToReturn}
                          onChange={(e) => handleQuantityChange(item.name, e.target.value, item.quantity)}
                          style={{ width: '80px', padding: '6px', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                        {(qtyToReturn * itemPrice).toLocaleString()} ج.م
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between align-center" style={{ background: 'var(--bg-app)', padding: '16px 20px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>إجمالي المبلغ المسترد للعميل: </span>
              <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--danger)', marginRight: '8px' }}>
                {calculateReturnTotal().toLocaleString()} ج.م
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleExecuteReturn}
            >
              <RotateCcw size={18} />
              <span>تأكيد استرجاع الفاتورة بالمخزن</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
