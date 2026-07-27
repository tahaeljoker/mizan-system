import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Boxes, 
  Search, 
  AlertTriangle,
  X
} from 'lucide-react';
import apiService from '../services/api';

const Inventory = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('جرد دوري');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['inventoryProducts'],
    queryFn: () => apiService.products.getAll()
  });

  const rawProds = productsData?.data || productsData?.products || productsData;
  const safeProductsList = Array.isArray(rawProds) ? rawProds : Array.isArray(productsData) ? productsData : [];

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, quantity, type, reason }) => apiService.products.adjustStock(id, quantity, type, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setShowAdjustModal(false);
      alert('تم تعديل كمية المخزون وتحديث السجلات بنجاح! ✅');
    },
    onError: (err) => {
      alert('حدث خطأ أثناء تعديل المخزون: ' + err.message);
    }
  });

  const filteredProducts = safeProductsList.filter(p => {
    if (!p) return false;
    const matchesSearch = (p.name && p.name.includes(searchQuery)) || (p.barcode && p.barcode.includes(searchQuery));
    const stock = p.stock || 0;
    const minStock = p.minStock || 5;

    if (filterType === 'low') {
      return matchesSearch && stock <= minStock && stock > 0;
    }
    if (filterType === 'out') {
      return matchesSearch && stock <= 0;
    }
    return matchesSearch;
  });

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustQty(0);
    setAdjustReason('جرد دوري');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty === 0) {
      alert('أدخل كمية تعديل صالحة (موجبة للزيادة، سالبة للخصم)');
      return;
    }

    const type = adjustQty > 0 ? 'ADD' : 'SUBTRACT';
    const quantity = Math.abs(adjustQty);

    adjustStockMutation.mutate({
      id: selectedProduct._id || selectedProduct.id,
      quantity,
      type,
      reason: adjustReason
    });
  };

  const lowStockCount = safeProductsList.filter(p => p && (p.stock || 0) <= (p.minStock || 5) && (p.stock || 0) > 0).length;
  const outOfStockCount = safeProductsList.filter(p => p && (p.stock || 0) <= 0).length;
  const totalStockValue = safeProductsList.reduce((sum, p) => sum + ((p?.stock || 0) * (p?.sellPrice || 0)), 0);

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة ورصد المخزون 📦</h1>
          <p style={{ color: 'var(--text-muted)' }}>متابعة كميات المنتجات بالمخازن، التنبيهات، التسويات والجرد الدوري.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-3 mb-24">
        <div className="card stat-card" style={{ borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">إجمالي القيمة التقديرية للمخزون</span>
            <span className="stat-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {totalStockValue.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إجمالي عدد الأصناف: {safeProductsList.length}</span>
          </div>
          <div className="stat-icon primary">
            <Boxes size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">أصناف قريبة من النفاد (نواقص)</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>
              {lowStockCount} أصناف
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>وصلت للحد الأدنى للمخزون</span>
          </div>
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">أصناف منتهية بالكامل (Out of Stock)</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>
              {outOfStockCount} أصناف
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الرصيد زيرو قطعية</span>
          </div>
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="header-search" style={{ width: '320px' }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="البحث باسم المنتج أو البارشود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-8">
            <button
              className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('all')}
            >
              جميع المنتجات ({safeProductsList.length})
            </button>
            <button
              className={`btn ${filterType === 'low' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ background: filterType === 'low' ? '#f59e0b' : '', borderColor: filterType === 'low' ? '#f59e0b' : '' }}
              onClick={() => setFilterType('low')}
            >
              النواقص ({lowStockCount})
            </button>
            <button
              className={`btn ${filterType === 'out' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ background: filterType === 'out' ? 'var(--danger)' : '', borderColor: filterType === 'out' ? 'var(--danger)' : '' }}
              onClick={() => setFilterType('out')}
            >
              المنتهية ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>جدول حصر وأرصدة المخزون</h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل أرصدة المخزون...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>الباركود</th>
                  <th>اسم الصنف</th>
                  <th>الفئة</th>
                  <th>الرصيد المتاح</th>
                  <th>حد الأمان</th>
                  <th>قيمة المخزون الإجمالية</th>
                  <th>الحالة</th>
                  <th>التسوية والجرد</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const stock = p.stock || 0;
                    const minStock = p.minStock || 5;
                    const isOut = stock <= 0;
                    const isLow = stock <= minStock && !isOut;

                    return (
                      <tr key={p._id || p.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.barcode || 'N/A'}</td>
                        <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                        <td><span className="badge info">{p.category || 'عام'}</span></td>
                        <td style={{ fontWeight: 'bold', fontSize: '15px' }}>{stock} {p.unit || 'قطعة'}</td>
                        <td>{minStock} قطعة</td>
                        <td>{((p.sellPrice || 0) * stock).toLocaleString()} ج.م</td>
                        <td>
                          {isOut ? (
                            <span className="badge danger">منتهي بالكامل 🛑</span>
                          ) : isLow ? (
                            <span className="badge warning">نواقص (قريب من النفاد) ⚠️</span>
                          ) : (
                            <span className="badge success">رصيد آمن وممتلئ</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => openAdjustModal(p)}
                          >
                            تعديل / تسوية الرصيد
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      لا توجد أصناف مطابقة للتصفية الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>تسوية ورصد مخزون صنف</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAdjustModal(false)} />
            </div>

            <div style={{ background: 'var(--bg-app)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedProduct.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                الرصيد الحالي بالمخزن: <strong style={{ color: 'var(--primary)' }}>{selectedProduct.stock || 0} قطعة</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div className="form-group mb-16">
                <label>كمية التعديل والتسوية *</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="أدخل كمية موجبة للزيادة أو سالبة للخصم"
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  مثال: ادخل 5 لإضافة 5 قطع، أو -3 لخصم 3 قطع من المخزون التالف أو المفقود.
                </span>
              </div>

              <div className="form-group mb-24">
                <label>سبب التسوية أو الجرد</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                >
                  <option value="جرد دوري">جرد دوري مستمر</option>
                  <option value="بضاعة تالفة">تسوية بضاعة تالفة / هالكة</option>
                  <option value="استلام توريد جديد">استلام توريد كمية جديدة</option>
                  <option value="خطأ بالفاتورة">تسوية خطأ بالبيانات</option>
                </select>
              </div>

              <div className="flex justify-end gap-12">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={adjustStockMutation.isPending}>
                  {adjustStockMutation.isPending ? 'جاري التسوية...' : 'حفظ تعديل المخزون'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
