import React, { useState } from 'react';
import { Search, Tag, Camera, Video, Volume2, X, Info } from 'lucide-react';
import { products } from '../data/mockData';

const PriceChecker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState('');
  
  // Load products list from localStorage to match actual data
  const productsList = JSON.parse(localStorage.getItem('mizan_products')) || products;

  const safeProducts = Array.isArray(productsList) ? productsList : [];
  const searchResults = searchQuery
    ? safeProducts.filter(p => {
        const q = searchQuery.trim().toLowerCase();
        const nameMatch = p?.name && String(p.name).toLowerCase().includes(q);
        const barcodeMatch = p?.barcode && String(p.barcode).toLowerCase().includes(q);
        const skuMatch = p?.sku && String(p.sku).toLowerCase().includes(q);
        const codeMatch = p?.code && String(p.code).toLowerCase().includes(q);
        const altBarcodesMatch = Array.isArray(p?.alternateBarcodes) && p.alternateBarcodes.some(b => String(b).toLowerCase().includes(q));
        return nameMatch || barcodeMatch || skuMatch || codeMatch || altBarcodesMatch;
      })
    : [];

  const handleScanBarcode = () => {
    const prod = productsList[0]; // Simulate scanning first product
    if (prod) {
      setSearchQuery(prod.barcode);
      setScannerFeedback(`تم مسح الباركود بنجاح: ${prod.name}`);
      setTimeout(() => {
        setShowCamera(false);
        setScannerFeedback('');
      }, 1500);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>استعلام الأسعار والمواصفات</h1>
          <p style={{ color: 'var(--text-muted)' }}>ابحث عن سعر بيع أي منتج ومواصفاته المتاحة بالمعرض بسرعة.</p>
        </div>
      </div>

      <div className="card mb-24" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="header-search" style={{ flex: 1, margin: 0 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="اكتب اسم المنتج أو امسح الباركود..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--primary-glow)', color: 'var(--primary)' }}
            onClick={() => {
              setShowCamera(true);
              setScannerFeedback('');
            }}
          >
            <Camera size={16} />
            <span>مسح كاميرا</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {searchResults.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div>
                <span className="badge info" style={{ fontSize: '11px', marginBottom: '4px', display: 'inline-block' }}>{p.category}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{p.name}</h3>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {p.sellPrice} ج.م <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {p.unit}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div>الباركود: <strong style={{ color: 'var(--text-main)', fontFamily: 'monospace' }}>{p.barcode}</strong></div>
              <div>المخزون المتاح بالرف: <strong style={{ color: p.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>{p.stock} {p.unit}</strong></div>
            </div>

            {/* Custom Specifications section */}
            {(p.sizes || p.colors || p.carpetDimensions || p.expiryDate || p.weightVolume) && (
              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '6px', fontSize: '12.5px', marginTop: '6px' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-main)' }}>تفاصيل ومواصفات المعرض:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {p.sizes && <div>📏 المقاسات المتاحة: <strong style={{ color: 'var(--text-main)' }}>{p.sizes}</strong></div>}
                  {p.colors && <div>🎨 الألوان المتوفرة: <strong style={{ color: 'var(--text-main)' }}>{p.colors}</strong></div>}
                  {p.carpetDimensions && <div>📐 أبعاد السجاد: <strong style={{ color: 'var(--text-main)' }}>{p.carpetDimensions}</strong></div>}
                  {p.expiryDate && <div>⏳ تاريخ الصلاحية: <strong style={{ color: 'var(--text-main)' }}>{p.expiryDate}</strong></div>}
                  {p.weightVolume && <div>⚖️ الوزن/الحجم: <strong style={{ color: 'var(--text-main)' }}>{p.weightVolume}</strong></div>}
                </div>
              </div>
            )}
          </div>
        ))}

        {searchQuery === '' && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            اكتب اسم المنتج أو امسح الباركود لعرض سعر بيع التجزئة والمواصفات المتاحة فوراً.
          </div>
        )}

        {searchQuery !== '' && searchResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
            لم يتم العثور على أي منتج يطابق مسمى البحث 🔍
          </div>
        )}
      </div>

      {/* Camera scanner dialog */}
      {showCamera && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>ماسح الباركود بالكاميرا</h3>
              <X className="modal-close" onClick={() => setShowCamera(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
              <div style={{ 
                width: '100%', 
                height: '200px', 
                background: '#000', 
                borderRadius: '8px', 
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Video size={32} style={{ color: 'var(--text-muted)' }} />
                  <span>جاري البحث عن باركود...</span>
                </div>
              </div>

              {scannerFeedback ? (
                <div className="badge success" style={{ padding: '8px 12px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                  <Volume2 size={16} />
                  <span>{scannerFeedback}</span>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleScanBarcode}
                >
                  محاكاة مسح: فستان سواريه (6221000101)
                </button>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCamera(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChecker;
