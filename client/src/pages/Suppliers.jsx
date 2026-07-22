import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Phone, User, DollarSign } from 'lucide-react';
import { suppliers as initialSuppliers } from '../data/mockData';

const Suppliers = () => {
  const [suppliersList, setSuppliersList] = useState(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    contact: '',
    balance: ''
  });

  const filteredSuppliers = suppliersList.filter(s => 
    s.name.includes(searchQuery) || s.phone.includes(searchQuery) || s.contact.includes(searchQuery)
  );

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      phone: '',
      contact: '',
      balance: '0'
    });
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      contact: supplier.contact,
      balance: supplier.balance.toString()
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      setSuppliersList(suppliersList.filter(s => s.id !== id));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      phone: formData.phone,
      contact: formData.contact,
      balance: parseFloat(formData.balance) || 0
    };

    if (editingSupplier) {
      setSuppliersList(suppliersList.map(s => s.id === editingSupplier.id ? { ...s, ...payload } : s));
    } else {
      setSuppliersList([...suppliersList, { id: 'sup' + (suppliersList.length + 1), ...payload }]);
    }
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة الموردين</h1>
          <p style={{ color: 'var(--text-muted)' }}>قائمة بجميع مصانع ومستوردي الملابس والشركات التي تتعامل معها.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '100%' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم المورد، الهاتف أو المسؤول..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم الشركة / المورد</th>
                <th>الهاتف</th>
                <th>الشخص المسؤول</th>
                <th>الحساب المستحق لنا / علينا</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '600' }}>{s.name}</td>
                  <td>
                    <div className="flex align-center gap-8" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
                      <span>{s.phone}</span>
                      <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </td>
                  <td>
                    <div className="flex align-center gap-8">
                      <User size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{s.contact}</span>
                    </div>
                  </td>
                  <td>
                    {s.balance < 0 ? (
                      <span className="text-danger" style={{ fontWeight: 'bold' }}>
                        مستحق علينا: {Math.abs(s.balance).toLocaleString()} ج.م
                      </span>
                    ) : s.balance > 0 ? (
                      <span className="text-success" style={{ fontWeight: 'bold' }}>
                        مستحق لنا: {s.balance.toLocaleString()} ج.م
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>0 ج.م</span>
                    )}
                  </td>
                  <td>
                    <div className="flex align-center justify-between" style={{ width: '80px', margin: '0 auto' }}>
                      <button 
                        onClick={() => openEditModal(s)}
                        style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id)}
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
              <h3>{editingSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}</h3>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>اسم المورد (اسم الشركة/المصنع) *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>رقم الهاتف للتواصل</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>اسم المسؤول (الشخص المفوض)</label>
                  <input 
                    type="text" 
                    value={formData.contact} 
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>الحساب الابتدائي المتبادل (ادخل قيمة سالبة إذا كنت مدين للمورد)</label>
                  <input 
                    type="number" 
                    value={formData.balance} 
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })} 
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

export default Suppliers;
