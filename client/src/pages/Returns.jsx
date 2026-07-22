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
        const invs = await apiService.invoices.getAll();
        const prods = await apiService.products.getAll();
        setInvoices(invs);
        setProducts(prods);
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

    // Search by ID or _id
    const inv = invoices.find(i => 
      (i.id && i.id.toLowerCase() === searchQuery.trim().toLowerCase()) || 
      (i._id && i._id.toLowerCase() === searchQuery.trim().toLowerCase())
    );

    if (inv) {
      if (inv.status === 'refunded') {
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

  const handleProcessReturn = async () => {
    const itemsToReturn = Object.entries(returnCart).filter(([_, qty]) => qty > 0);
    
    if (itemsToReturn.length === 0) {
      alert('الرجاء تحديد كمية المنتجات المراد إرجاعها.');
      return;
    }

    if (!window.confirm('هل أنت متأكد من إتمام عملية الاسترجاع وتحديث المخزون؟')) {
      return;
    }

    // 1. Calculate Refund Total
    let refundAmount = 0;
    itemsToReturn.forEach(([itemName, returnQty]) => {
      const itemInInvoice = foundInvoice.items.find(i => i.name === itemName);
      if (itemInInvoice) {
        refundAmount += (itemInInvoice.price * returnQty);
      }
    });

    const targetInvoiceId = foundInvoice._id || foundInvoice.id;

    try {
      // 2. Prepare updated invoice elements
      const updatedItems = foundInvoice.items.map(item => {
        const retQty = returnCart[item.name] || 0;
        return { ...item, qty: item.qty - retQty };
      }).filter(item => item.qty > 0);

      const newTotal = foundInvoice.total - refundAmount;
      const newStatus = updatedItems.length === 0 ? 'refunded' : 'partial_refund';

      // 3. Update Invoice via API
      await apiService.invoices.update(targetInvoiceId, {
        items: updatedItems,
        total: newTotal,
        status: newStatus
      });

      // 4. Update Product Stock in MongoDB
      for (const [itemName, returnQty] of itemsToReturn) {
        const prod = products.find(p => p.name === itemName);
        if (prod) {
          const targetProdId = prod._id || prod.id;
          await apiService.products.update(targetProdId, {
            stock: Number(prod.stock) + Number(returnQty)
          });
        }
      }

      // Refresh both invoices and products from database
      const invs = await apiService.invoices.getAll();
      const prods = await apiService.products.getAll();
      setInvoices(invs);
      setProducts(prods);

      alert(`تم تنفيذ الاسترجاع بنجاح. المبلغ المسترد: ${refundAmount} ج.م`);
    } catch (err) {
      console.warn('Failed saving return details to MongoDB, falling back to local storage:', err.message);

      // Local storage fallback
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === foundInvoice.id || inv._id === foundInvoice._id) {
          const updatedItems = inv.items.map(item => {
            const retQty = returnCart[item.name] || 0;
            return { ...item, qty: item.qty - retQty };
          }).filter(item => item.qty > 0);

          const newTotal = inv.total - refundAmount;
          return { 
            ...inv, 
            items: updatedItems,
            total: newTotal,
            status: updatedItems.length === 0 ? 'refunded' : 'partial_refund' 
          };
        }
        return inv;
      });

      const updatedProducts = [...products];
      itemsToReturn.forEach(([itemName, returnQty]) => {
        const productIndex = updatedProducts.findIndex(p => p.name === itemName);
        if (productIndex >= 0) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: Number(updatedProducts[productIndex].stock) + Number(returnQty)
          };
        }
      });

      setInvoices(updatedInvoices);
      setProducts(updatedProducts);
      localStorage.setItem('mizan_invoices', JSON.stringify(updatedInvoices));
      localStorage.setItem('mizan_products', JSON.stringify(updatedProducts));
      alert(`تم تنفيذ الاسترجاع محلياً بنجاح. المبلغ المسترد: ${refundAmount} ج.م`);
    }

    // Reset UI
    setFoundInvoice(null);
    setSearchQuery('');
    setReturnCart({});
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>نظام المرتجعات واسترداد الأموال</h1>
          <p style={{ color: 'var(--text-muted)' }}>ابحث برقم الفاتورة لإرجاع المنتجات وتحديث المخزون تلقائياً.</p>
        </div>
      </div>

      <div className="card mb-24" style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="اكتب رقم الفاتورة أو امسح باركود الفاتورة..." 
              style={{ paddingRight: '40px', width: '100%' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }}>
            بحث
          </button>
        </form>

        {errorMsg && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {foundInvoice && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex justify-between align-center mb-24" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', color: 'var(--primary)' }}>فاتورة رقم: {foundInvoice.id}</h2>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                تاريخ الفاتورة: {foundInvoice.date} | الكاشير: {foundInvoice.cashier}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{foundInvoice.total} ج.م</div>
              <span className={`badge ${foundInvoice.status === 'completed' ? 'success' : 'warning'}`}>
                {foundInvoice.status === 'completed' ? 'مكتملة' : 'مرتجع جزئي'}
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>اختر الكميات المراد استرجاعها:</h3>
          
          <table className="data-table mb-24">
            <thead>
              <tr>
                <th>المنتج</th>
                <th>السعر</th>
                <th>الكمية المُباعة</th>
                <th style={{ width: '150px' }}>الكمية المسترجعة</th>
              </tr>
            </thead>
            <tbody>
              {foundInvoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                  <td>{item.price} ج.م</td>
                  <td>{item.qty}</td>
                  <td>
                    <input 
                      type="number" 
                      className="input-field" 
                      min="0" 
                      max={item.qty}
                      value={returnCart[item.name] || 0}
                      onChange={(e) => handleQuantityChange(item.name, e.target.value, item.qty)}
                      style={{ width: '80px', textAlign: 'center', padding: '6px' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setFoundInvoice(null)}>إلغاء</button>
            <button className="btn btn-danger" onClick={handleProcessReturn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={18} />
              تأكيد الاسترجاع واستعادة المخزون
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
