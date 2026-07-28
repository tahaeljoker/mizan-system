import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Eye, 
  Check, 
  Calendar,
  X
} from 'lucide-react';
import apiService from '../services/api';

const PurchaseOrders = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: poData, isLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => apiService.purchaseOrders.getAll()
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliersListPO'],
    queryFn: () => apiService.suppliers.getAll()
  });

  const { data: productsData } = useQuery({
    queryKey: ['productsListPO'],
    queryFn: () => apiService.products.getAll()
  });

  const rawOrders = poData?.data || poData?.purchaseOrders || poData;
  const ordersList = Array.isArray(rawOrders) ? rawOrders : [];

  const rawSuppliers = suppliersData?.data || suppliersData?.suppliers || suppliersData;
  const suppliersList = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  const rawProducts = productsData?.data || productsData?.products || productsData;
  const productsList = Array.isArray(rawProducts) ? rawProducts : [];

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { productId: '', name: '', quantity: 1, costPrice: 0 }
  ]);

  const createPOMutation = useMutation({
    mutationFn: (data) => apiService.purchaseOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setShowAddModal(false);
    }
  });

  const receivePOMutation = useMutation({
    mutationFn: (id) => apiService.purchaseOrders.receive(id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      if (selectedOrder) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'RECEIVED' } : null);
      }
    }
  });

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { productId: '', name: '', quantity: 1, costPrice: 0 }]);
  };

  const handleProductSelect = (index, productId) => {
    const prod = productsList.find(p => p._id === productId || p.id === productId);
    const updated = [...orderItems];
    updated[index] = {
      productId: productId,
      name: prod?.name || '',
      quantity: updated[index].quantity || 1,
      costPrice: prod?.costPrice || 0
    };
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const handleSubmitNewPO = (e) => {
    e.preventDefault();
    if (!selectedSupplierId || orderItems.length === 0) return;

    const validItems = orderItems.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) return;

    const totalCost = validItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.costPrice)), 0);

    createPOMutation.mutate({
      supplierId: selectedSupplierId,
      items: validItems,
      totalAmount: totalCost
    });
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>أوامر الشراء والتوريد</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة فواتير التوريد من الموردين وتسليمات شحنات البضاعة بالمخزن.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>إصدار أمر شراء جديد</span>
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>سجل أوامر التوريد والشراء</h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل أوامر الشراء...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>المورد</th>
                  <th>عدد الأصناف</th>
                  <th>الإجمالي (ج.م)</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.length > 0 ? (
                  ordersList.map((po) => (
                    <tr key={po._id || po.id}>
                      <td style={{ fontWeight: 'bold' }}>{po.orderNumber || po._id}</td>
                      <td>{po.supplierName || po.supplierId?.name || 'مورد عام'}</td>
                      <td>{po.items?.length || 0} أصناف</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        {(po.totalAmount || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        {po.status === 'RECEIVED' ? (
                          <span className="badge success">تم الاستلام بالمخزن</span>
                        ) : (
                          <span className="badge warning">قيد الانتظار والتوريد</span>
                        )}
                      </td>
                      <td>{po.createdAt ? new Date(po.createdAt).toLocaleDateString('ar-EG') : 'اليوم'}</td>
                      <td>
                        <div className="flex gap-8">
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => { setSelectedOrder(po); setShowViewModal(true); }}
                          >
                            <Eye size={14} />
                            <span>معاينة</span>
                          </button>
                          {po.status !== 'RECEIVED' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => receivePOMutation.mutate(po._id || po.id)}
                            >
                              <Check size={14} />
                              <span>تأكيد الاستلام</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      لا توجد أوامر شراء مسجلة حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
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
            maxWidth: '650px',
            padding: '24px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>إصدار أمر شراء وبضاعة جديدة</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleSubmitNewPO}>
              <div className="form-group mb-16">
                <label>اختر المورد *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- اختر المورد من القائمة --</option>
                  {suppliersList.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name} ({s.company || 'شركة'})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', display: 'block' }}>قائمة البضاعة المطلوبة:</label>
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex gap-8 mb-8" style={{ alignItems: 'center' }}>
                    <select
                      style={{ flex: 2 }}
                      value={item.productId}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      required
                    >
                      <option value="">-- اختر الصنف --</option>
                      {productsList.map(p => (
                        <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="الكمية"
                      style={{ flex: 1 }}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      required
                    />

                    <input
                      type="number"
                      placeholder="سعر التكلفة"
                      style={{ flex: 1 }}
                      value={item.costPrice}
                      onChange={(e) => handleItemChange(idx, 'costPrice', Number(e.target.value))}
                    />
                  </div>
                ))}

                <button type="button" className="btn btn-secondary" style={{ fontSize: '12px', marginTop: '4px' }} onClick={handleAddItemRow}>
                  + إضافة صنف آخر للأمر
                </button>
              </div>

              <div className="flex justify-end gap-12 mt-24">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">إصدار وترحيل أمر الشراء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
