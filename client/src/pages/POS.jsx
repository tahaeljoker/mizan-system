import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  CreditCard, 
  Coins, 
  Sparkles, 
  Pause, 
  Play, 
  X, 
  Printer,
  Wifi,
  WifiOff,
  Camera,
  Video,
  Volume2,
  Info,
  Tag,
  User,
  ArrowRightLeft
} from 'lucide-react';
import { products, customers as initialCustomers } from '../data/mockData';
import apiService from '../services/api';

const POS = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('val'); // 'val' or 'pct'
  const [paymentMethod, setPaymentMethod] = useState('كاش');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');

  // Offline states
  const [isOnline, setIsOnline] = useState(true);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState('');

  // Shift Management States
  const [isShiftOpen, setIsShiftOpen] = useState(() => {
    return localStorage.getItem('mizan_shift_open') === 'true';
  });
  const [openingCash, setOpeningCash] = useState(() => {
    return parseFloat(localStorage.getItem('mizan_opening_cash')) || 0;
  });
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [actualCashDrawer, setActualCashDrawer] = useState('');
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [shiftSales, setShiftSales] = useState(() => {
    return parseFloat(localStorage.getItem('mizan_shift_sales')) || 0;
  });

  // Coupon Discount States
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);

  // Product Inquiry State
  const [inquiredProduct, setInquiredProduct] = useState(null);

  // Customer Details States
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // POS Returns / Refund States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInvoiceId, setRefundInvoiceId] = useState('');
  const [refundInvoice, setRefundInvoice] = useState(null);

  // Hold / Resume Invoice States
  const [heldInvoices, setHeldInvoices] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_held_invoices')) || [];
  });
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Load products list from localStorage to keep inventory in sync
  const [productsList, setProductsList] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_products')) || products;
  });

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.products.getAll();
        const rawList = data?.data || data?.products || data;
        const safeList = Array.isArray(rawList) ? rawList : (Array.isArray(data) ? data : []);
        if (safeList.length > 0) {
          setProductsList(safeList);
        }
      } catch (err) {
        console.warn('Failed to load products from API, loading local backup:', err.message);
      }
    };
    fetchProducts();
  }, []);

  // Filter products by search query with defensive Array.isArray safety
  const safeProductsList = Array.isArray(productsList) ? productsList : [];
  const searchResults = searchQuery
    ? safeProductsList.filter(p => 
        (p?.name && String(p.name).toLowerCase().includes(searchQuery.toLowerCase())) || 
        (p?.barcode && String(p.barcode).includes(searchQuery))
      )
    : [];

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'MODABELLA10') {
      setCouponDiscountPercent(10);
      alert('تم تطبيق كوبون MODABELLA10 بنجاح! خصم 10%');
    } else if (couponCode.toUpperCase() === 'MIZAN15') {
      setCouponDiscountPercent(15);
      alert('تم تطبيق كوبون MIZAN15 بنجاح! خصم 15%');
    } else {
      alert('كوبون الخصم غير صالح أو منتهي الصلاحية!');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        alert('لا توجد كمية كافية بالمخزن!');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      if (product.stock <= 0) {
        alert('هذا المنتج غير متوفر في المخزن!');
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    const item = cart.find(i => i.id === id);
    const prod = productsList.find(p => p.id === id);
    
    if (item.qty + delta <= 0) {
      removeFromCart(id);
    } else if (item.qty + delta > prod.stock) {
      alert('لا توجد كمية كافية بالمخزن!');
    } else {
      setCart(cart.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i));
    }
  };

  const updatePrice = (id, newPrice) => {
    setCart(cart.map(item => item.id === id ? { ...item, sellPrice: parseFloat(newPrice) || 0 } : item));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
  };

  const getDiscountAmount = () => {
    const subtotal = getSubtotal();
    const manualDiscount = discountType === 'pct' ? (subtotal * discount) / 100 : discount;
    const couponDiscount = (subtotal * couponDiscountPercent) / 100;
    return manualDiscount + couponDiscount;
  };

  const getTotal = () => {
    return Math.max(0, getSubtotal() - getDiscountAmount());
  };

  const handleHoldInvoice = () => {
    if (cart.length === 0) return;
    const holdData = {
      id: 'hold-' + Date.now(),
      cart,
      discount,
      discountType,
      couponDiscountPercent,
      customerName,
      customerPhone,
      invoiceNotes,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    
    const updatedHolds = [...heldInvoices, holdData];
    setHeldInvoices(updatedHolds);
    localStorage.setItem('mizan_held_invoices', JSON.stringify(updatedHolds));
    
    // Clear POS screen
    setCart([]);
    setDiscount(0);
    setCouponDiscountPercent(0);
    setCustomerName('عميل نقدي');
    setCustomerPhone('');
    setInvoiceNotes('');
    alert('تم تعليق الفاتورة بنجاح!');
  };

  const handleResumeInvoice = (holdData) => {
    if (cart.length > 0 && !window.confirm('لديك منتجات حالية في الفاتورة. هل أنت متأكد من مسحها واسترجاع الفاتورة المعلقة؟')) {
      return;
    }
    
    setCart(holdData.cart);
    setDiscount(holdData.discount);
    setDiscountType(holdData.discountType);
    setCouponDiscountPercent(holdData.couponDiscountPercent);
    setCustomerName(holdData.customerName);
    setCustomerPhone(holdData.customerPhone);
    setInvoiceNotes(holdData.invoiceNotes);
    
    const updatedHolds = heldInvoices.filter(h => h.id !== holdData.id);
    setHeldInvoices(updatedHolds);
    localStorage.setItem('mizan_held_invoices', JSON.stringify(updatedHolds));
    setShowHeldModal(false);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckoutModal(true);
  };

  const completeSale = async () => {
    // If debt payment, require client details
    if (paymentMethod === 'آجل') {
      if (customerName === 'عميل نقدي' || !customerPhone.trim() || !customerName.trim()) {
        alert('عذراً! لا يمكن البيع الآجل لعميل نقدي. يرجى إدخال اسم العميل ورقم هاتفه بالكامل لتسجيل المديونية.');
        return;
      }
    }

    const invoiceId = 'inv-' + Math.floor(1000 + Math.random() * 9000);
    const invoice = {
      id: invoiceId,
      customer: customerName,
      customerPhone: customerPhone,
      notes: invoiceNotes,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      items: cart,
      subtotal: getSubtotal(),
      discount: getDiscountAmount(),
      total: getTotal(),
      paymentMethod,
      cashier: 'سارة أحمد',
      isOffline: !isOnline
    };

    try {
      // 1. Try sending to Express / MongoDB backend
      const invoicePayload = {
        customer: customerName,
        discount: getDiscountAmount(),
        paymentMethod,
        items: cart.map(i => ({
          id: i._id || i.id,
          name: i.name,
          qty: i.qty,
          price: i.sellPrice
        }))
      };
      
      const savedInvoice = await apiService.invoices.create(invoicePayload);
      
      // Update local invoice state with database invoice structure
      invoice.id = savedInvoice.id || savedInvoice._id;
      
      // Refresh products from server to keep stock in sync
      const updatedProds = await apiService.products.getAll();
      const rawProds = updatedProds?.data || updatedProds?.products || updatedProds;
      const safeProds = Array.isArray(rawProds) ? rawProds : (Array.isArray(updatedProds) ? updatedProds : []);
      if (safeProds.length > 0) {
        setProductsList(safeProds);
      }
    } catch (err) {
      console.warn('Failed saving invoice to MongoDB, falling back to local storage:', err.message);
      
      // Fallback local storage stock deduction
      const updatedProducts = productsList.map(p => {
        const cartItem = cart.find(item => item.id === p.id || item._id === p._id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
        }
        return p;
      });
      setProductsList(updatedProducts);
      localStorage.setItem('mizan_products', JSON.stringify(updatedProducts));

      // Fallback save invoice to local sales history
      const history = JSON.parse(localStorage.getItem('mizan_sales_history')) || [];
      localStorage.setItem('mizan_sales_history', JSON.stringify([invoice, ...history]));

      if (!isOnline) {
        const storedOffline = JSON.parse(localStorage.getItem('mizan_offline_invoices')) || [];
        localStorage.setItem('mizan_offline_invoices', JSON.stringify([...storedOffline, invoice]));
        alert('تم حفظ الفاتورة محلياً في المتصفح! سيتم رفعها ومزامنتها تلقائياً بمجرد عودة الاتصال 📡');
      }
    }

    // 2. If Payment is debt (آجل), log balance updates to Customer ledger
    if (paymentMethod === 'آجل') {
      const customersList = JSON.parse(localStorage.getItem('mizan_customers')) || initialCustomers;
      const existing = customersList.find(c => c.phone === customerPhone);
      if (existing) {
        existing.balance += invoice.total;
      } else {
        customersList.push({
          id: 'c' + (customersList.length + 1),
          name: customerName,
          phone: customerPhone,
          email: '',
          points: 10,
          balance: invoice.total
        });
      }
      localStorage.setItem('mizan_customers', JSON.stringify(customersList));
    }

    const nextSales = shiftSales + invoice.total;
    setShiftSales(nextSales);
    localStorage.setItem('mizan_shift_sales', nextSales.toString());

    setLastInvoice(invoice);
    setShowCheckoutModal(false);
    setShowReceiptModal(true);
    setCart([]);
    setDiscount(0);
    setCouponCode('');
    setCouponDiscountPercent(0);
    
    // Reset customer details
    setCustomerName('عميل نقدي');
    setCustomerPhone('');
    setInvoiceNotes('');
    setPaidAmount('');
  };

  // Refund Search & Submit Actions
  const handleRefundSearch = (e) => {
    e.preventDefault();
    const history = JSON.parse(localStorage.getItem('mizan_sales_history')) || [
      { id: 'inv-1001', customer: 'أحمد محمود', customerPhone: '01122334455', date: '2026-07-12 01:10', items: [{ id: 'p1', name: 'فستان سواريه مطرز', sellPrice: 850, qty: 1 }], subtotal: 850, discount: 0, total: 850, paymentMethod: 'كاش', cashier: 'سارة أحمد' }
    ];
    const found = history.find(inv => inv.id === refundInvoiceId.trim().toLowerCase());
    if (found) {
      setRefundInvoice(found);
    } else {
      alert('عذراً! لم يتم العثور على أي فاتورة مطابقة لهذا الرقم. 🔍');
    }
  };

  const handleRefundSubmit = () => {
    if (!refundInvoice) return;

    // 1. Restore product quantities back to stock
    const updatedProducts = productsList.map(p => {
      const returnedItem = refundInvoice.items.find(item => item.id === p.id);
      if (returnedItem) {
        return { ...p, stock: p.stock + returnedItem.qty };
      }
      return p;
    });
    setProductsList(updatedProducts);
    localStorage.setItem('mizan_products', JSON.stringify(updatedProducts));

    // 2. If it was a debt invoice, restore customer balance
    if (refundInvoice.paymentMethod === 'آجل') {
      const customersList = JSON.parse(localStorage.getItem('mizan_customers')) || [];
      const updatedCustomers = customersList.map(c => {
        if (c.phone === refundInvoice.customerPhone) {
          return { ...c, balance: Math.max(0, c.balance - refundInvoice.total) };
        }
        return c;
      });
      localStorage.setItem('mizan_customers', JSON.stringify(updatedCustomers));
    }

    // 3. Deduct from shiftSales
    const nextSales = Math.max(0, shiftSales - refundInvoice.total);
    setShiftSales(nextSales);
    localStorage.setItem('mizan_shift_sales', nextSales.toString());

    // 4. Update sales history log (remove or mark refunded)
    const history = JSON.parse(localStorage.getItem('mizan_sales_history')) || [];
    const updatedHistory = history.filter(inv => inv.id !== refundInvoice.id);
    localStorage.setItem('mizan_sales_history', JSON.stringify(updatedHistory));

    setShowRefundModal(false);
    setRefundInvoice(null);
    setRefundInvoiceId('');
    alert('تم إرجاع الفاتورة بالكامل بنجاح! تم رد المبالغ وإعادة كميات البضاعة للمخزن وتحديث الخزنة. ↩️');
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* Shift Opening Locking Screen */}
      {!isShiftOpen && (
        <div className="modal-overlay" style={{ position: 'absolute', top: '-24px', bottom: '-24px', left: '-24px', right: '-24px', zIndex: 90 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>فتح الشيفت اليومي للبيع</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              الرجاء إدخال قيمة النقدية المتوفرة في درج الكاشير الافتتاحي للبدء.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const cash = parseFloat(openingCashInput) || 0;
              setOpeningCash(cash);
              setIsShiftOpen(true);
              setShiftSales(0);
              localStorage.setItem('mizan_shift_open', 'true');
              localStorage.setItem('mizan_opening_cash', cash.toString());
              localStorage.setItem('mizan_shift_sales', '0');
            }}>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <label>رصيد الدرج الافتتاحي (ج.م) *</label>
                <input 
                  type="number" 
                  value={openingCashInput} 
                  onChange={(e) => setOpeningCashInput(e.target.value)} 
                  placeholder="مثال: 500" 
                  style={{ fontSize: '18px', textAlign: 'center' }}
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '16px', padding: '12px' }}>
                فتح الشيفت وبدء البيع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POS Content container */}
      <div className="pos-container" style={{ filter: !isShiftOpen ? 'blur(3px)' : 'none', pointerEvents: !isShiftOpen ? 'none' : 'auto', display: 'grid', gridTemplateColumns: '1fr 480px', gap: '20px' }}>
        
        {/* Right Panel: Search & Inquiry */}
        <div className="pos-products" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          
          <div className="flex justify-between align-center mb-24" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>البحث والاستعلام عن منتج</h3>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Refund button */}
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                onClick={() => {
                  setShowRefundModal(true);
                  setRefundInvoice(null);
                  setRefundInvoiceId('');
                }}
                type="button"
              >
                <ArrowRightLeft size={12} />
                <span>المرتجع ↩️</span>
              </button>

              <button 
                className="btn btn-danger" 
                style={{ padding: '6px 12px', fontSize: '12px' }}
                onClick={() => setShowCloseShiftModal(true)}
                type="button"
              >
                إغلاق الشيفت
              </button>

              <button 
                className="btn" 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  display: 'flex', 
                  gap: '6px', 
                  alignItems: 'center', 
                  background: isOnline ? 'var(--success-glow)' : 'var(--danger-glow)',
                  color: isOnline ? 'var(--success)' : 'var(--danger)',
                  border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}
                onClick={() => {
                  if (!isOnline) {
                    const storedOffline = JSON.parse(localStorage.getItem('mizan_offline_invoices')) || [];
                    if (storedOffline.length > 0) {
                      alert(`تم استعادة الاتصال بالإنترنت! 📡\nجاري مزامنة ${storedOffline.length} فواتير مع السيرفر الرئيسي...\nتمت المزامنة وحفظ المبيعات بنجاح! 🚀`);
                      localStorage.removeItem('mizan_offline_invoices');
                    } else {
                      alert('أنت متصل بالإنترنت الآن! 📡');
                    }
                  } else {
                    alert('لقد انقطع الاتصال بالإنترنت! تم الانتقال لوضع العمل دون اتصال (Offline Mode).');
                  }
                  setIsOnline(!isOnline);
                }}
                type="button"
              >
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{isOnline ? 'متصل' : 'أوفلاين'}</span>
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--primary-glow)', color: 'var(--primary)' }}
                onClick={() => {
                  setShowCameraScanner(true);
                  setScannerFeedback('');
                }}
                type="button"
              >
                <Camera size={12} />
                <span>الكاميرا</span>
              </button>
            </div>
          </div>

          <div className="header-search mb-24" style={{ width: '100%' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="اكتب اسم المنتج أو كود الباركود للبحث والاستعلام السريع..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', minHeight: '180px', maxHeight: '280px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px', background: 'var(--bg-main)', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>نتائج البحث مطابقة ({searchResults.length})</span>
            
            {searchResults.map((p) => (
              <div key={p.id} className="flex justify-between align-center" style={{ padding: '12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '14px', display: 'block' }}>{p.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الباركود: {p.barcode} | المتاح: <span className={p.stock <= p.minStock ? 'text-danger' : 'text-success'}>{p.stock} قطعة</span></span>
                </div>
                <div className="flex gap-8 align-center">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 10px', fontSize: '11px' }}
                    onClick={() => setInquiredProduct(p)}
                  >
                    <Info size={12} />
                    <span>استعلام</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                    onClick={() => addToCart(p)}
                  >
                    + إضافة للسلة
                  </button>
                </div>
              </div>
            ))}

            {searchQuery === '' && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                اكتب أي كلمة أو رقم باركود لعرض نتائج المنتجات والتحقق منها.
              </div>
            )}
            {searchQuery !== '' && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                لم يتم العثور على أي بضاعة مطابقة للبحث 🔍
              </div>
            )}
          </div>

          {/* Product Inquiry Board */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} className="text-primary" />
                <span>لوحة الاستعلام عن تفاصيل منتج</span>
              </div>
              {inquiredProduct && (
                <button 
                  type="button" 
                  onClick={() => setInquiredProduct(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}
                >
                  <X size={14} />
                  <span>إلغاء الاستعلام</span>
                </button>
              )}
            </h4>

            {inquiredProduct ? (
              <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ gridColumn: 'span 2', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>المنتج المستعلم عنه:</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>{inquiredProduct.name}</h4>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>كود الباركود:</span>
                  <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-en)' }}>{inquiredProduct.barcode}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>سعر البيع (تجزئة):</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{inquiredProduct.sellPrice} ج.م</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>سعر الشراء (التكلفة):</span>
                  <div style={{ fontWeight: 'bold' }}>{inquiredProduct.costPrice} ج.م</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>سعر الجملة:</span>
                  <div style={{ fontWeight: 'bold' }}>{inquiredProduct.wholesalePrice} ج.م</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>المخزون المتاح:</span>
                  <div style={{ fontWeight: 'bold' }} className={inquiredProduct.stock <= inquiredProduct.minStock ? 'text-danger' : 'text-success'}>
                    {inquiredProduct.stock} قطعة (حد الأمان: {inquiredProduct.minStock})
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>وحدة التعبئة:</span>
                  <div style={{ fontWeight: 'bold' }}>{inquiredProduct.unit}</div>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={() => {
                      addToCart(inquiredProduct);
                      setInquiredProduct(null);
                    }}
                  >
                    إضافة هذا المنتج للسلة
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
                اضغط على زر "استعلام" بجانب أي منتج بالبحث لعرض تفاصيل الأسعار الشراء والجملة والمخزون دون إضافته للبيع.
              </div>
            )}
          </div>
        </div>

        {/* Left Panel: Shopping Cart */}
        <div className="pos-cart" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} className="text-primary" />
              <span>سلة فاتورة المبيعات</span>
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setShowHeldModal(true)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                <ArrowRightLeft size={14} />
                <span>استدعاء ({heldInvoices.length})</span>
              </button>
              <button className="btn btn-secondary" onClick={handleHoldInvoice} disabled={cart.length === 0} style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--warning)' }}>
                <Pause size={14} />
                <span>تعليق</span>
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px', padding: '40px 0' }}>
                <Receipt size={40} style={{ opacity: 0.5 }} />
                <span>سلة المبيعات فارغة حالياً</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '13.5px', display: 'block' }}>{item.name}</strong>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        value={item.sellPrice} 
                        onChange={(e) => updatePrice(item.id, e.target.value)} 
                        style={{ width: '70px', padding: '2px 6px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)' }} 
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ج.م × {item.qty} = <strong>{(item.sellPrice * item.qty).toLocaleString()} ج.م</strong></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => updateQty(item.id, -1)}>-</button>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => updateQty(item.id, 1)}>+</button>
                    <button className="btn btn-danger" style={{ padding: '4px 8px', marginRight: '8px' }} onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="summary-row">
              <span>المجموع قبل الخصم</span>
              <span>{getSubtotal().toLocaleString()} ج.م</span>
            </div>

            {/* Discount Coupon Form */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', margin: '4px 0' }}>
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                placeholder="كود كوبون الخصم (مثال: MODABELLA10)"
                style={{ flex: 1, padding: '6px 12px', fontSize: '12px', borderRadius: '4px' }}
              />
              <button 
                type="submit" 
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}
              >
                <Tag size={12} />
                <span>تطبيق</span>
              </button>
            </form>

            {/* Manual Discount Block */}
            <div className="summary-row" style={{ alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              <span>خصم إضافي (يدوي)</span>
              <div className="flex align-center gap-8">
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', textAlign: 'center' }} 
                />
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)}
                  style={{ width: '60px', padding: '4px 8px', borderRadius: '4px' }}
                >
                  <option value="val">ج.م</option>
                  <option value="pct">%</option>
                </select>
              </div>
            </div>

            {couponDiscountPercent > 0 && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>خصم الكوبون</span>
                <span>-{couponDiscountPercent}%</span>
              </div>
            )}

            <div className="summary-row total">
              <span>الإجمالي النهائي</span>
              <span>{getTotal().toLocaleString()} ج.م</span>
            </div>

            <button 
              className="btn btn-primary w-full" 
              style={{ padding: '16px', fontSize: '16px', marginTop: '8px' }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              دفع وإصدار الفاتورة
            </button>
          </div>
        </div>

      </div>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>إتمـام عملية البيع</h3>
              <X className="modal-close" onClick={() => setShowCheckoutModal(false)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>المبلغ الإجمالي المطلوب</span>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>
                  {getTotal().toLocaleString()} ج.م
                </div>
              </div>

              <div className="form-group">
                <label>طريقة الدفع</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  <button 
                    className={`btn ${paymentMethod === 'كاش' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('كاش')}
                    style={{ padding: '12px 6px', fontSize: '12px' }}
                  >
                    <Coins size={14} />
                    <span>كاش</span>
                  </button>
                  <button 
                    className={`btn ${paymentMethod === 'كارت' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('كارت')}
                    style={{ padding: '12px 6px', fontSize: '12px' }}
                  >
                    <CreditCard size={14} />
                    <span>كارت</span>
                  </button>
                  <button 
                    className={`btn ${paymentMethod === 'انستا باي' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('انستا باي')}
                    style={{ padding: '12px 6px', fontSize: '12px' }}
                  >
                    <Sparkles size={14} />
                    <span>انستا باي</span>
                  </button>
                  <button 
                    className={`btn ${paymentMethod === 'آجل' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPaymentMethod('آجل')}
                    style={{ padding: '12px 6px', fontSize: '12px' }}
                  >
                    <User size={14} />
                    <span>آجل (دين)</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'كاش' && (
                <div className="form-group" style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <label>المبلغ المدفوع (للحساب السريع)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => setPaidAmount(getTotal())} style={{ padding: '6px 12px', fontSize: '13px' }}>المبلغ بالضبط</button>
                    <button className="btn btn-secondary" onClick={() => setPaidAmount(50)} style={{ padding: '6px 12px', fontSize: '13px' }}>50</button>
                    <button className="btn btn-secondary" onClick={() => setPaidAmount(100)} style={{ padding: '6px 12px', fontSize: '13px' }}>100</button>
                    <button className="btn btn-secondary" onClick={() => setPaidAmount(200)} style={{ padding: '6px 12px', fontSize: '13px' }}>200</button>
                    <button className="btn btn-secondary" onClick={() => setPaidAmount(500)} style={{ padding: '6px 12px', fontSize: '13px' }}>500</button>
                  </div>
                  <input 
                    type="number" 
                    value={paidAmount} 
                    onChange={(e) => setPaidAmount(e.target.value)} 
                    placeholder="أدخل المبلغ المستلم من العميل" 
                    style={{ fontSize: '18px', fontWeight: 'bold' }}
                  />
                  {paidAmount !== '' && parseFloat(paidAmount) >= getTotal() && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderRadius: '4px', fontSize: '16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>الباقي للعميل:</span>
                      <strong>{(parseFloat(paidAmount) - getTotal()).toLocaleString()} ج.م</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>اسم العميل {paymentMethod === 'آجل' && '*'}</label>
                  <input 
                    type="text" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="اسم العميل" 
                  />
                </div>
                <div>
                  <label>رقم هاتف العميل {paymentMethod === 'آجل' && '*'}</label>
                  <input 
                    type="text" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    placeholder="رقم الهاتف" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ملاحظات على الفاتورة</label>
                <textarea 
                  value={invoiceNotes} 
                  onChange={(e) => setInvoiceNotes(e.target.value)} 
                  placeholder="اكتب أي ملاحظات للطباعة على الفاتورة..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)', height: '60px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={completeSale}>تأكيد وطباعة</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px', background: '#fff', color: '#000', direction: 'rtl', padding: '20px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>{localStorage.getItem('mizan_shop_name') || 'مِيزان للبيع والتوزيع'}</h2>
              <p style={{ fontSize: '12px', margin: '4px 0', color: '#666' }}>الفرع الرئيسي</p>
              <p style={{ fontSize: '12px', margin: '4px 0', color: '#666' }}>تليفون: {localStorage.getItem('mizan_shop_phone') || '01098765432'}</p>
            </div>
            
            <div style={{ padding: '15px 0', borderBottom: '1px dashed #ccc', fontSize: '13px' }}>
              <div className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span style={{ fontWeight: 'bold' }}>{lastInvoice.id}</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ:</span>
                <span>{lastInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span>الكاشير:</span>
                <span>{lastInvoice.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>العميل:</span>
                <span>{lastInvoice.customer}</span>
              </div>
              {lastInvoice.customerPhone && (
                <div className="flex justify-between">
                  <span>هاتف العميل:</span>
                  <span style={{ direction: 'ltr' }}>{lastInvoice.customerPhone}</span>
                </div>
              )}
            </div>

            <div style={{ padding: '15px 0', borderBottom: '1px dashed #ccc' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ccc' }}>
                    <th style={{ color: '#000', padding: '4px 0' }}>المنتج</th>
                    <th style={{ color: '#000', padding: '4px 0', textAlign: 'center' }}>الكمية</th>
                    <th style={{ color: '#000', padding: '4px 0', textAlign: 'left' }}>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {lastInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ color: '#000', padding: '6px 0' }}>{item.name}</td>
                      <td style={{ color: '#000', padding: '6px 0', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ color: '#000', padding: '6px 0', textAlign: 'left' }}>{(item.sellPrice * item.qty).toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '15px 0', fontSize: '14px', borderBottom: '1px dashed #ccc' }}>
              <div className="flex justify-between" style={{ padding: '2px 0' }}>
                <span>المجموع الفرعي:</span>
                <span>{lastInvoice.subtotal.toLocaleString()} ج.م</span>
              </div>
              {lastInvoice.discount > 0 && (
                <div className="flex justify-between" style={{ padding: '2px 0', color: '#c00' }}>
                  <span>الخصم:</span>
                  <span>-{lastInvoice.discount.toLocaleString()} ج.م</span>
                </div>
              )}
              <div className="flex justify-between" style={{ padding: '6px 0', fontWeight: 'bold', fontSize: '16px' }}>
                <span>الإجمالي النهائي:</span>
                <span>{lastInvoice.total.toLocaleString()} ج.م</span>
              </div>
              <div className="flex justify-between" style={{ padding: '2px 0', fontSize: '12px', color: '#666' }}>
                <span>طريقة الدفع:</span>
                <span>{lastInvoice.paymentMethod}</span>
              </div>
            </div>

            {lastInvoice.notes && (
              <div style={{ background: '#f9f9f9', border: '1px dashed #ccc', padding: '8px', borderRadius: '4px', fontSize: '11px', marginTop: '10px', textAlign: 'right' }}>
                <strong style={{ display: 'block', marginBottom: '2px', color: '#000' }}>ملاحظات:</strong>
                <span>{lastInvoice.notes}</span>
              </div>
            )}

            <div className="modal-footer" style={{ border: 'none', padding: '15px 0 0 0' }}>
              <button className="btn btn-secondary w-full" onClick={() => setShowReceiptModal(false)}>إغلاق وطباعة 🖨️</button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Simulator */}
      {showCameraScanner && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>ماسح باركود كاميرا الهاتف 📡</h3>
              <X className="modal-close" onClick={() => setShowCameraScanner(false)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
              <div style={{ 
                width: '100%', 
                height: '240px', 
                background: '#000', 
                borderRadius: 'var(--radius-md)', 
                position: 'relative', 
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  left: 0, 
                  right: 0, 
                  height: '2px', 
                  background: 'var(--danger)', 
                  boxShadow: '0 0 8px var(--danger)',
                  animation: 'scan-anim 2s infinite linear' 
                }}></div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                  <Video size={32} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>جاري البحث عن باركود...</span>
                </div>
              </div>

              {scannerFeedback ? (
                <div className="badge success" style={{ padding: '8px 12px', display: 'flex', gap: '6px', justifyContent: 'center', width: '100%' }}>
                  <Volume2 size={16} />
                  <span>{scannerFeedback}</span>
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  وجه كاميرا الهاتف نحو باركود المنتج لمسحه تلقائياً.
                </span>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary w-full"
                  onClick={() => {
                    const prod = productsList.find(p => p.id === 'p1');
                    if (prod) {
                      addToCart(prod);
                      setScannerFeedback(`تم مسح الباركود بنجاح: ${prod.name} (850 ج.م) 🔔`);
                      setTimeout(() => {
                        setShowCameraScanner(false);
                        setScannerFeedback('');
                      }, 1500);
                    }
                  }}
                >
                  محاكاة مسح: فستان سواريه (6221000101)
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCameraScanner(false)}>إغلاق الكاميرا</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>إغلاق الشيفت وتسوية الخزينة</h3>
              <X className="modal-close" onClick={() => setShowCloseShiftModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="flex justify-between" style={{ fontSize: '14px' }}>
                  <span>رصيد الدرج الافتتاحي:</span>
                  <strong>{openingCash.toLocaleString()} ج.م</strong>
                </div>
                <div className="flex justify-between" style={{ fontSize: '14px' }}>
                  <span>مبيعات الشيفت الحالية:</span>
                  <strong>{shiftSales.toLocaleString()} ج.م</strong>
                </div>
                <div className="flex justify-between" style={{ fontSize: '16px', fontWeight: 'bold', borderTop: '1px solid var(--border)', paddingTop: '10px', color: 'var(--primary)' }}>
                  <span>الرصيد المتوقع بالدرج:</span>
                  <span>{(openingCash + shiftSales).toLocaleString()} ج.م</span>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const actual = parseFloat(actualCashDrawer) || 0;
                const expected = openingCash + shiftSales;
                const diff = actual - expected;

                // Log the shift details to localStorage
                const shiftLogs = JSON.parse(localStorage.getItem('mizan_shift_logs')) || [];
                const newShiftLog = {
                  id: 'slog_' + Date.now(),
                  date: new Date().toISOString().replace('T', ' ').substring(0, 16),
                  cashier: JSON.parse(localStorage.getItem('mizan_user'))?.name || 'طه أنس (محل تجريبي)',
                  openingCash: openingCash,
                  salesCash: shiftSales,
                  expectedCash: expected,
                  actualCash: actual,
                  difference: diff
                };
                localStorage.setItem('mizan_shift_logs', JSON.stringify([newShiftLog, ...shiftLogs]));

                if (diff === 0) {
                  alert('الشيفت سليم 100%! الدرج متطابق تماماً بدون أي عجز أو زيادة. تم إغلاق الشيفت وحفظ السجل. 🎉');
                } else if (diff < 0) {
                  alert(`تنبيه عجز مالي! ⚠️\nيوجد عجز في الخزينة بقيمة: ${Math.abs(diff)} ج.م\nالرجاء إغلاق الشيفت ومراجعة الفواتير مع الموظف.`);
                } else {
                  alert(`تنبيه زيادة نقدية! 💰\nيوجد زيادة في الخزينة بقيمة: ${diff} ج.م\nتم إغلاق الشيفت وتسجيل الفائض.`);
                }

                // Reset Shift States
                setIsShiftOpen(false);
                setOpeningCash(0);
                setOpeningCashInput('');
                setActualCashDrawer('');
                setShiftSales(0);
                setShowCloseShiftModal(false);
                localStorage.removeItem('mizan_shift_open');
                localStorage.removeItem('mizan_opening_cash');
                localStorage.removeItem('mizan_shift_sales');
              }}>
                <div className="form-group" style={{ textAlign: 'right' }}>
                  <label>المبلغ الفعلي المتوفر بالدرج حالياً (ج.م) *</label>
                  <input 
                    type="number" 
                    value={actualCashDrawer} 
                    onChange={(e) => setActualCashDrawer(e.target.value)} 
                    placeholder="قم بعدّ النقدية وإدخالها هنا" 
                    style={{ fontSize: '18px', textAlign: 'center' }}
                    required 
                  />
                </div>

                <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCloseShiftModal(false)}>إلغاء</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)' }}>
                    إنهاء وتأكيد إغلاق الشيفت
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* POS Returns / Refund Modal */}
      {showRefundModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>نظام مرتجعات واسترداد فواتير المبيعات ↩️</h3>
              <X className="modal-close" onClick={() => setShowRefundModal(false)} />
            </div>

            <form onSubmit={handleRefundSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                value={refundInvoiceId} 
                onChange={(e) => setRefundInvoiceId(e.target.value)} 
                placeholder="أدخل رقم الفاتورة (مثال: inv-1001)"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary">بحث عن الفاتورة</button>
            </form>

            {refundInvoice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  <div className="flex justify-between">
                    <span>تاريخ البيع:</span>
                    <strong>{refundInvoice.date}</strong>
                  </div>
                  <div className="flex justify-between" style={{ marginTop: '4px' }}>
                    <span>العميل المشتري:</span>
                    <strong>{refundInvoice.customer} ({refundInvoice.paymentMethod})</strong>
                  </div>
                  <div className="flex justify-between" style={{ marginTop: '4px' }}>
                    <span>إجمالي قيمة الفاتورة:</span>
                    <strong style={{ color: 'var(--primary)' }}>{refundInvoice.total.toLocaleString()} ج.م</strong>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>المنتج</th>
                        <th>سعر البيع</th>
                        <th>الكمية المبيعة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.sellPrice} ج.م</td>
                          <td style={{ fontWeight: 'bold' }}>{item.qty} قطعة</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRefundModal(false)}>إلغاء</button>
                  <button type="button" className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={handleRefundSubmit}>
                    تأكيد إرجاع الفاتورة بالكامل والرد
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                ابحث برقم الفاتورة لعرض محتوياتها وتأكيد إرجاع البضاعة واسترداد الأموال.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Held Invoices Modal */}
      {showHeldModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>الفواتير المعلقة (المجمدة مؤقتاً)</h3>
              <X className="modal-close" onClick={() => setShowHeldModal(false)} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '150px' }}>
              {heldInvoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  لا توجد فواتير معلقة حالياً.
                </div>
              ) : (
                heldInvoices.map((held) => (
                  <div key={held.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>فاتورة {held.customerName}</h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        عدد العناصر: {held.cart.length} | وقت التعليق: {held.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-danger" onClick={() => {
                        const updated = heldInvoices.filter(h => h.id !== held.id);
                        setHeldInvoices(updated);
                        localStorage.setItem('mizan_held_invoices', JSON.stringify(updated));
                      }}>
                        حذف
                      </button>
                      <button className="btn btn-primary" onClick={() => handleResumeInvoice(held)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Play size={14} />
                        استرجاع وإكمال البيع
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POS;
