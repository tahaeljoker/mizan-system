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

  const productsList = productsData?.products || productsData || [];

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

  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery));
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

  const lowStockCount = productsList.filter(p => (p.stock || 0) <= (p.minStock || 5) && (p.stock || 0) > 0).length;
  const outOfStockCount = productsList.filter(p => (p.stock || 0) <= 0).length;
  const totalStockValue = productsList.reduce((sum, p) => sum + ((p.stock || 0) * (p.sellPrice || 0)), 0);

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
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إجمالي عدد الأصناف: {productsList.length}</span>
          </div>
          <div className="stat-icon primary">
            <Boxes size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilterType('low')}>
          <div className="stat-info">
            <span className="stat-title">أصناف قريبة من النفاد (Low Stock)</span>
            <span className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
              {lowStockCount} أصناف
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>اقتربت من الحد الأدنى</span>
          </div>
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilterType('out')}>
          <div className="stat-info">
            <span className="stat-title">أصناف منتهية بالكامل (Out of Stock)</span>
            <span className="stat-value" style={{ color: outOfStockCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
              {outOfStockCount} أصناف
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>تتطلب إعادة طلب من المورد</span>
          </div>
          <div className="stat-icon danger">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="flex justify-between align-center">
          <div className="header-search" style={{ width: '60%' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم المنتج أو الباركود..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-8">
            <button className={`btn ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('all')}>
              كل الأصناف ({productsList.length})
            </button>
            <button className={`btn ${filterType === 'low' ? 'btn-warning' : 'btn-secondary'}`} onClick={() => setFilterType('low')}>
              مخزون منخفض ({lowStockCount})
            </button>
            <button className={`btn ${filterType === 'out' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFilterType('out')}>
              منتهي ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الباركود / SKU</th>
                <th>المخزون الحالي</th>
                <th>الحد الأدنى</th>
                <th>سعر البيع</th>
                <th>حالة المخزون</th>
                <th style={{ textAlign: 'center' }}>تسوية الكمية</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>جاري تحميل المخزون...</td></tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const stock = product.stock || 0;
                  const minStock = product.minStock || 5;
                  const isOut = stock <= 0;
                  const isLow = stock <= minStock && !isOut;

                  return (
                    <tr key={product._id || product.id}>
                      <td style={{ fontWeight: '600' }}>{product.name}</td>
                      <td>{product.barcode || product.sku || 'N/A'}</td>
                      <td style={{ fontWeight: 'bold', fontSize: '15px' }}>{stock} {product.unit || 'قطعة'}</td>
                      <td>{minStock} {product.unit || 'قطعة'}</td>
                      <td style={{ fontWeight: 'bold' }}>{(product.sellPrice || 0).toLocaleString()} ج.م</td>
                      <td>
                        <span className={`badge badge-${isOut ? 'danger' : isLow ? 'warning' : 'success'}`}>
                          {isOut ? 'منتهي' : isLow ? 'منخفض' : 'متوفر'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openAdjustModal(product)}>
                          تسوية / تعديل
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد منتجات مطابقة في المخزن</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>تسوية مخزون ({selectedProduct.name})</h3>
              <button className="close-btn" onClick={() => setShowAdjustModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="p-12 mb-16" style={{ background: 'var(--bg-app)', borderRadius: '8px' }}>
                <p><strong>المخزون الحالي:</strong> {selectedProduct.stock || 0} {selectedProduct.unit || 'قطعة'}</p>
              </div>
              <div className="form-group mb-16">
                <label className="form-label">مقدار التعديل (موجب للزيادة / سالب للخصم) *</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  placeholder="مثال: 5 أو -2"
                  required
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">سبب التعديل</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="جرد دوري / هالك / عينة"
                />
              </div>
              <div className="flex gap-12 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ التسوية</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
