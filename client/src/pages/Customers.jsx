import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X, Phone, Mail, DollarSign, Coins } from 'lucide-react';
import apiService from '../services/api';

const Customers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    loyaltyPoints: '0'
  });

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: () => apiService.customers.getAll({ search: searchQuery })
  });

  const customersList = customersData?.customers || customersData || [];

  const createMutation = useMutation({
    mutationFn: (data) => apiService.customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.customers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      loyaltyPoints: '0'
    });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      loyaltyPoints: (customer.loyaltyPoints || customer.points || 0).toString()
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف العميل بالفعل؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      loyaltyPoints: parseInt(formData.loyaltyPoints) || 0
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer._id || editingCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSettlePayment = async (customer) => {
    const balance = customer.balance || 0;
    if (balance <= 0) {
      alert('ممتاز! هذا العميل لا توجد عليه أي ديون لتسديدها حالياً.');
      return;
    }

    const payInput = prompt(`تسديد ديون العميل: ${customer.name}\nالمديونية الحالية: ${balance} ج.م\nالرجاء إدخال القيمة المدفوعة نقداً (ج.م):`);
    if (payInput === null) return;

    const payAmount = parseFloat(payInput) || 0;
    if (payAmount <= 0) {
      alert('من فضلك أدخل مبلغ تسوية صحيح!');
      return;
    }

    if (payAmount > balance) {
      alert('لا يمكن تسديد مبلغ أكبر من قيمة الدين الفعلي!');
      return;
    }

    try {
      await apiService.finance.recordCustomerPayment({
        customerId: customer._id || customer.id,
        amount: payAmount,
        paymentMethod: 'CASH',
        notes: 'تسوية حساب عميل من لوحة العملاء'
      });
      alert(`تم تسجيل تسوية الديون بنجاح! المبلغ المسدد: ${payAmount} ج.م ✅`);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      alert('حدث خطأ في التسوية: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة العملاء والديون والولاء</h1>
          <p style={{ color: 'var(--text-muted)' }}>لوحة الحسابات الآجلة وبرامج الولاء ونقاط المكافآت.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>تسجيل عميل جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '100%' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم العميل أو رقم التليفون لفرز الحسابات..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>قائمة العملاء المشتركين</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم العميل</th>
                <th>الهاتف</th>
                <th>البريد الإلكتروني</th>
                <th>نقاط الولاء</th>
                <th>المستحقات الآجلة (الديون)</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>جاري تحميل العملاء من قاعدة البيانات...</td></tr>
              ) : customersList.length > 0 ? (
                customersList.map((customer) => (
                  <tr key={customer._id || customer.id}>
                    <td style={{ fontWeight: 'bold' }}>{customer.name}</td>
                    <td><Phone size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> {customer.phone}</td>
                    <td><Mail size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> {customer.email || 'غير مسجل'}</td>
                    <td>
                      <span className="badge badge-warning flex align-center gap-4" style={{ width: 'fit-content' }}>
                        <Coins size={14} />
                        {customer.loyaltyPoints || customer.points || 0} نقطة
                      </span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: (customer.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      {(customer.balance || 0).toLocaleString()} ج.م
                    </td>
                    <td>
                      <div className="flex gap-8 justify-center">
                        {(customer.balance || 0) > 0 && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => handleSettlePayment(customer)}
                            title="تسديد مديونية"
                          >
                            <DollarSign size={14} />
                            <span>تسديد دين</span>
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(customer)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(customer._id || customer.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد عملاء مسجلون حالياً</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCustomer ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group mb-16">
                <label className="form-label">اسم العميل بالكامل *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">رقم التليفون *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">البريد الإلكتروني (اختياري)</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group mb-24">
                <label className="form-label">نقاط الولاء المبدئية</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.loyaltyPoints}
                  onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                />
              </div>
              <div className="flex gap-12 justify-end">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
