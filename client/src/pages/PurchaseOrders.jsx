import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  Eye, 
  Check, 
  Truck, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { purchaseOrders as initialOrders, suppliers, products } from '../data/mockData';

const PurchaseOrders = () => {
  const [ordersList, setOrdersList] = useState(initialOrders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.name || '');
  const [orderItems, setOrderItems] = useState([{ name: products[0]?.name || '', qty: 1, costPrice: products[0]?.costPrice || 0 }]);

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { name: products[0]?.name || '', qty: 1, costPrice: products[0]?.costPrice || 0 }]);
  };

  const handleRemoveItemRow = (idx) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = orderItems.map((item, i) => {
      if (i === idx) {
        let updatedItem = { ...item, [field]: value };
        if (field === 'name') {
          // Auto-fill cost price from product selection
          const prod = products.find(p => p.name === value);
          if (prod) {
            updatedItem.costPrice = prod.costPrice;
          }
        }
        return updatedItem;
      }
      return item;
    });
    setOrderItems(updated);
  };

  const getOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.qty * (parseFloat(item.costPrice) || 0)), 0);
  };

  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('من فضلك أضف منتج واحد على الأقل للمذكرة!');
      return;
    }

    const newOrder = {
      id: 'po-' + Math.floor(5000 + Math.random() * 999),
      supplier: selectedSupplier,
      date: new Date().toISOString().split('T')[0],
      total: getOrderTotal(),
      status: 'pending',
      items: orderItems.map(item => ({
        name: item.name,
        qty: parseInt(item.qty) || 1,
        costPrice: parseFloat(item.costPrice) || 0
      }))
    };

    setOrdersList([newOrder, ...ordersList]);
    setShowAddModal(false);
    // Reset order items form
    setOrderItems([{ name: products[0]?.name || '', qty: 1, costPrice: products[0]?.costPrice || 0 }]);
  };

  const handleMarkReceived = (orderId) => {
    if (window.confirm('هل تريد تأكيد استلام البضائع؟ سيتم زيادة كميات المنتجات في المخازن تلقائياً.')) {
      setOrdersList(ordersList.map(o => o.id === orderId ? { ...o, status: 'received' } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'received' });
      }
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
          <h1 style={{ fontSize: '28px' }}>طلبات الشراء والتوريد</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة الفواتير الواردة من الموردين، وإدخال الكميات الجديدة للمخازن.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>طلب توريد جديد</span>
        </button>
      </div>

      {/* Orders List */}
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
              {ordersList.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{order.id}</td>
                  <td style={{ fontWeight: '600' }}>{order.supplier}</td>
                  <td>
                    <div className="flex align-center gap-8" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>{order.date}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{order.total.toLocaleString()} ج.م</td>
                  <td>
                    <span className={`badge ${order.status === 'received' ? 'success' : 'warning'}`}>
                      {order.status === 'received' ? 'تم الاستلام والشحن' : 'بانتظار وصول البضاعة'}
                    </span>
                  </td>
                  <td>
                    <div className="flex align-center justify-between" style={{ width: '130px', margin: '0 auto' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye size={12} />
                        <span>تفاصيل</span>
                      </button>

                      {order.status === 'pending' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '6px 10px', fontSize: '12px', background: 'var(--success)' }}
                          onClick={() => handleMarkReceived(order.id)}
                          title="تأكيد الاستلام"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h3>مذكرة توريد رقم: {selectedOrder.id}</h3>
              <X className="modal-close" onClick={() => setShowViewModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>المورد:</span>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedOrder.supplier}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>التاريخ:</span>
                  <div style={{ fontWeight: 'bold' }}>{selectedOrder.date}</div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>حالة الطلب:</span>
                  <div>
                    <span className={`badge ${selectedOrder.status === 'received' ? 'success' : 'warning'}`}>
                      {selectedOrder.status === 'received' ? 'مستلمة' : 'انتظار الشحن'}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>إجمالي التكلفة:</span>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{selectedOrder.total.toLocaleString()} ج.م</div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>البضائع المطلوبة:</h4>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead style={{ background: 'var(--bg-hover)' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>اسم المنتج</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>الكمية المطلوبة</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>سعر التكلفة</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '10px 12px' }}>{item.name}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty} قطعة</td>
                          <td style={{ padding: '10px 12px', textAlign: 'left' }}>{item.costPrice.toLocaleString()} ج.م</td>
                          <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 'bold' }}>{(item.qty * item.costPrice).toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(245, 158, 11, 0.05)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <AlertCircle size={20} className="text-warning" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    هذه المذكرة معلقة. عند استلام الشحنة وتفريغها، اضغط على "تأكيد الاستلام" لزيادة أرصدة المخازن آلياً بمقدار البضائع الواردة.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>إغلاق</button>
              {selectedOrder.status === 'pending' && (
                <button className="btn btn-primary" onClick={() => handleMarkReceived(selectedOrder.id)}>
                  تأكيد الاستلام والشحن للمخزن
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>إنشاء مذكرة توريد شراء جديدة</h3>
              <X className="modal-close" onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleCreateOrder}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>اختر المورد *</label>
                  <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between align-center mb-24">
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-muted)' }}>تفاصيل بضائع الفاتورة الواردة</label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={handleAddItemRow}>
                      + إضافة سطر منتج
                    </button>
                  </div>

                  <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="flex align-center gap-16">
                        <div style={{ flex: 2 }}>
                          <select value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)}>
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ width: '80px' }}>
                          <input 
                            type="number" 
                            value={item.qty} 
                            min="1" 
                            placeholder="الكمية" 
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)} 
                          />
                        </div>
                        <div style={{ width: '110px' }}>
                          <input 
                            type="number" 
                            value={item.costPrice} 
                            placeholder="سعر التكلفة" 
                            onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)} 
                          />
                        </div>
                        {orderItems.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItemRow(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignCenter: 'center' }}>
                  <span>إجمالي الفاتورة التقريبي:</span>
                  <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>{getOrderTotal().toLocaleString()} ج.م</strong>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ كـ مسودة معلقة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
