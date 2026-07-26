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

  const ordersList = poData?.purchaseOrders || poData || [];
  const suppliersList = suppliersData?.suppliers || suppliersData || [];
  const productsList = productsData?.products || productsData || [];

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

  const handleRemoveItemRow = (idx) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = orderItems.map((item, i) => {
      if (i === idx) {
        let updatedItem = { ...item, [field]: value };
        if (field === 'productId') {
          const prod = productsList.find(p => p._id === value || p.id === value);
          if (prod) {
            updatedItem.name = prod.name;
            updatedItem.costPrice = prod.costPrice || 0;
          }
        }
        return updatedItem;
      }
      return item;
    });
    setOrderItems(updated);
  };

  const getOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.costPrice) || 0)), 0);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('اختر المورد أولاً');
      return;
    }
    if (orderItems.length === 0 || !orderItems[0].productId) {
      alert('اختر منتج واحد على الأقل للمذكرة!');
      return;
    }

    const payload = {
      supplierId: selectedSupplierId,
      items: orderItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: parseInt(item.quantity) || 1,
        costPrice: parseFloat(item.costPrice) || 0,
        total: (parseInt(item.quantity) || 1) * (parseFloat(item.costPrice) || 0)
      })),
      totalAmount: getOrderTotal(),
      paymentStatus: 'UNPAID'
    };

    createPOMutation.mutate(payload);
  };

  const handleMarkReceived = (orderId) => {
    if (window.confirm('هل تريد تأكيد استلام البضائع؟ سيتم زيادة كميات المنتجات في المخازن تلقائياً.')) {
      receivePOMutation.mutate(orderId);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>طلبات الشراء والتوريد (PO)</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة الفواتير الواردة من الموردين، وإدخال الكميات الجديدة للمخازن.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>طلب توريد جديد</span>
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>المورد</th>
                <th>التاريخ</th>
                <th>إجمالي الفاتورة</th>
                <th>حالة التوريد</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>جاري تحميل طلبات التوريد...</td></tr>
              ) : ordersList.length > 0 ? (
                ordersList.map((order) => (
                  <tr key={order._id || order.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{order.poNumber || order._id}</td>
                    <td style={{ fontWeight: '600' }}>{order.supplierId?.name || order.supplier || 'مورد'}</td>
                    <td>
                      <div className="flex align-center gap-8" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={14} />
                        <span>{new Date(order.createdAt || order.date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{(order.totalAmount || order.total || 0).toLocaleString()} ج.م</td>
                    <td>
                      <span className={`badge ${order.status === 'RECEIVED' ? 'success' : 'warning'}`}>
                        {order.status === 'RECEIVED' ? 'تم الاستلام والشحن' : 'بانتظار وصول البضاعة'}
                      </span>
                    </td>
                    <td>
                      <div className="flex align-center justify-center gap-8">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye size={12} />
                          <span>تفاصيل</span>
                        </button>

                        {order.status !== 'RECEIVED' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ background: 'var(--success)' }}
                            onClick={() => handleMarkReceived(order._id || order.id)}
                          >
                            <Check size={12} />
                            <span>استلام</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد طلبات توريد حالية</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add PO */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>إنشاء طلب توريد جديد</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="form-group mb-16">
                <label className="form-label">اختر المورد *</label>
                <select 
                  className="form-control" 
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- اختر مورد --</option>
                  {suppliersList.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <h4 style={{ fontSize: '15px', marginBottom: '12px' }}>أصناف الطلبية:</h4>
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex gap-8 mb-12 align-center">
                  <select 
                    className="form-control" 
                    value={item.productId}
                    onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    required
                  >
                    <option value="">-- اختر المنتج --</option>
                    {productsList.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    placeholder="الكمية"
                    className="form-control" 
                    style={{ width: '100px' }}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    min="1"
                    required
                  />
                  <input 
                    type="number" 
                    placeholder="سعر الشراء"
                    className="form-control" 
                    style={{ width: '120px' }}
                    value={item.costPrice}
                    onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                    required
                  />
                  {orderItems.length > 1 && (
                    <button type="button" className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleRemoveItemRow(idx)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm mb-16" onClick={handleAddItemRow}>
                + إضافة صنف آخر
              </button>

              <div className="flex justify-between align-center mb-16 p-12" style={{ background: 'var(--bg-app)', borderRadius: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>إجمالي الفاتورة:</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>{getOrderTotal().toLocaleString()} ج.م</span>
              </div>

              <div className="flex gap-12 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ وإرسال الطلب</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View PO */}
      {showViewModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>تفاصيل طلب التوريد ({selectedOrder.poNumber || selectedOrder._id})</h3>
              <button className="close-btn" onClick={() => setShowViewModal(false)}><X size={20} /></button>
            </div>
            <div className="mb-16">
              <p><strong>المورد:</strong> {selectedOrder.supplierId?.name || selectedOrder.supplier}</p>
              <p><strong>الحالة:</strong> {selectedOrder.status}</p>
              <p><strong>الإجمالي:</strong> {(selectedOrder.totalAmount || selectedOrder.total || 0).toLocaleString()} ج.م</p>
            </div>
            <div className="table-container mb-16">
              <table>
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>سعر الشراء</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.name}</td>
                      <td>{it.quantity || it.qty}</td>
                      <td>{(it.costPrice || 0).toLocaleString()} ج.م</td>
                      <td>{((it.quantity || it.qty || 0) * (it.costPrice || 0)).toLocaleString()} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
