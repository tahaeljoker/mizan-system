import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Phone, Mail, Award, DollarSign, Coins } from 'lucide-react';
import { customers as initialCustomers } from '../data/mockData';

const Customers = () => {
  // Sync customers list with localStorage
  const [customersList, setCustomersList] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_customers')) || initialCustomers;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    points: '0'
  });

  const filteredCustomers = customersList.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery) || (c.email && c.email.includes(searchQuery))
  );

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      points: '0'
    });
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      points: customer.points.toString()
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف العميل بالفعل؟')) {
      const updated = customersList.filter(c => c.id !== id);
      setCustomersList(updated);
      localStorage.setItem('mizan_customers', JSON.stringify(updated));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      points: parseInt(formData.points) || 0
    };

    let updated = [];
    if (editingCustomer) {
      updated = customersList.map(c => c.id === editingCustomer.id ? { ...c, ...payload } : c);
    } else {
      updated = [...customersList, { id: 'c' + (customersList.length + 1), ...payload, balance: 0 }];
    }
    setCustomersList(updated);
    localStorage.setItem('mizan_customers', JSON.stringify(updated));
    setShowModal(false);
  };

  // Log a customer paying their debt / credit payment
  const handleSettlePayment = (customerId) => {
    const customer = customersList.find(c => c.id === customerId);
    if (!customer) return;

    if (customer.balance <= 0) {
      alert('ممتاز! هذا العميل لا توجد عليه أي ديون لتسديدها حالياً.');
      return;
    }

    const payInput = prompt(`تسديد ديون العميل: ${customer.name}\nالمديونية الحالية: ${customer.balance} ج.م\nالرجاء إدخال القيمة المدفوعة نقداً (ج.م):`);
    if (payInput === null) return; // Cancelled

    const payAmount = parseFloat(payInput) || 0;
    if (payAmount <= 0) {
      alert('من فضلك أدخل مبلغ تسوية صحيح!');
      return;
    }

    if (payAmount > customer.balance) {
      alert('لا يمكن تسديد مبلغ أكبر من قيمة الدين الفعلي!');
      return;
    }

    const updated = customersList.map(c => {
      if (c.id === customerId) {
        return { ...c, balance: Math.max(0, c.balance - payAmount) };
      }
      return c;
    });

    setCustomersList(updated);
    localStorage.setItem('mizan_customers', JSON.stringify(updated));
    alert(`تم تسجيل تسوية الديون بنجاح! المبلغ المسدد: ${payAmount} ج.م. المديونية المتبقية: ${customer.balance - payAmount} ج.م ✅`);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة العملاء</h1>
          <p style={{ color: 'var(--text-muted)' }}>لوحة المبيعات الآجلة، برامج الولاء ونقاط المكافآت لعملاء المحل.</p>
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
            placeholder="البحث باسم العميل أو رقم التليفون لفرز الحسابات المديرة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>قائمة العملاء المشتركين بالمتجر</h3>
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
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '600' }}>{c.name}</td>
                  <td>
                    <div className="flex align-center gap-8" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
                      <span>{c.phone}</span>
                      <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </td>
                  <td>
                    {c.email ? (
                      <div className="flex align-center gap-8">
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{c.email}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dark)' }}>غير متوفر</span>
                    )}
                  </td>
                  <td>
                    <div className="flex align-center gap-8" style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                      <Award size={16} />
                      <span>{c.points} نقطة</span>
                    </div>
                  </td>
                  <td>
                    {c.balance > 0 ? (
                      <span className="text-danger" style={{ fontWeight: 'bold' }}>
                        عليه ديون: {c.balance.toLocaleString()} ج.م
                      </span>
                    ) : (
                      <span className="text-success" style={{ fontWeight: 'bold' }}>
                        لا توجد مستحقات
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex align-center justify-between" style={{ width: '130px', margin: '0 auto', gap: '8px' }}>
                      {c.balance > 0 && (
                        <button 
                          onClick={() => handleSettlePayment(c.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', gap: '4px', background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid var(--success)' }}
                          title="تسديد المديونية"
                        >
                          <Coins size={12} />
                          <span>تسديد</span>
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(c)}
                        style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCustomer ? 'تعديل بيانات عميل' : 'تسجيل عميل جديد'}</h3>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>اسم العميل الثنائي/الثلاثي *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>رقم هاتف العميل *</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>البريد الإلكتروني (اختياري)</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>رصيد نقاط الترحيب</label>
                  <input 
                    type="number" 
                    value={formData.points} 
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
