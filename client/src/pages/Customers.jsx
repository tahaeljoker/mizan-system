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

  const raw = customersData?.data || customersData?.customers || customersData;
  const customersList = Array.isArray(raw) ? raw : [];

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
      phone: customer.phone || '',
      email: customer.email || '',
      loyaltyPoints: String(customer.loyaltyPoints || '0')
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

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

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف هذا العميل من القاعدة بالفعل؟')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة العملاء ونقاط الولاء</h1>
          <p style={{ color: 'var(--text-muted)' }}>سجل العملاء، المديونيات المستحقة، ونقاط المكافآت.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '100%' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="البحث باسم العميل أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>دليل حسابات العملاء</h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل سجل العملاء...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>اسم العميل</th>
                  <th>رقم الهاتف</th>
                  <th>البريد الإلكتروني</th>
                  <th>نقاط الولاء</th>
                  <th>المديونية (ج.م)</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {customersList.length > 0 ? (
                  customersList.map((c) => (
                    <tr key={c._id || c.id}>
                      <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                      <td>{c.phone || 'غير مسجل'}</td>
                      <td>{c.email || 'غير مسجل'}</td>
                      <td>
                        <span className="badge info flex align-center gap-4" style={{ display: 'inline-flex' }}>
                          <Coins size={14} />
                          <span>{c.loyaltyPoints || 0} نقطة</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: c.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {(c.balance || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="action-btn text-primary" onClick={() => openEditModal(c)} title="تعديل">
                            <Edit size={16} />
                          </button>
                          <button className="action-btn text-danger" onClick={() => handleDelete(c._id || c.id)} title="حذف">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      لا يوجد عملاء مسجلون حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
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
            maxWidth: '500px',
            padding: '24px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-16">
                <label>اسم العميل بالكامل *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: أحمد محمود"
                  required
                />
              </div>

              <div className="form-group mb-16">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01012345678"
                />
              </div>

              <div className="form-group mb-16">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="flex justify-end gap-12 mt-24">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ العميل</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
