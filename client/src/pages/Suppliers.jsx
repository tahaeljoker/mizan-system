import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X, Phone, User, DollarSign } from 'lucide-react';
import apiService from '../services/api';

const Suppliers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    contactPerson: '',
    balance: '0'
  });

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', searchQuery],
    queryFn: () => apiService.suppliers.getAll({ search: searchQuery })
  });

  const suppliersList = suppliersData?.suppliers || suppliersData || [];

  const createMutation = useMutation({
    mutationFn: (data) => apiService.suppliers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.suppliers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowModal(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiService.suppliers.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    }
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      company: '',
      phone: '',
      contactPerson: '',
      balance: '0'
    });
    setShowModal(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      company: supplier.company || supplier.name,
      phone: supplier.phone,
      contactPerson: supplier.contactPerson || supplier.contact || '',
      balance: (supplier.balance || 0).toString()
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const payload = {
      name: formData.name,
      company: formData.company || formData.name,
      phone: formData.phone,
      contactPerson: formData.contactPerson,
      balance: parseFloat(formData.balance) || 0
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier._id || editingSupplier.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSettleSupplier = async (supplier) => {
    const balance = supplier.balance || 0;
    if (balance <= 0) {
      alert('لا تترتب أي مستحقات مالية واجبة الدفع لـ هذا المورد حالياً.');
      return;
    }

    const payInput = prompt(`سداد مستحقات المورد: ${supplier.name}\nالمستحق الدفع: ${balance} ج.م\nالرجاء إدخال المبلغ المدفوع (ج.م):`);
    if (payInput === null) return;

    const payAmount = parseFloat(payInput) || 0;
    if (payAmount <= 0) {
      alert('من فضلك أدخل مبلغ سداد صحيح!');
      return;
    }

    try {
      await apiService.finance.recordSupplierPayment({
        supplierId: supplier._id || supplier.id,
        amount: payAmount,
        paymentMethod: 'CASH',
        notes: 'سداد مستحقات مورد'
      });
      alert(`تم تسجيل سداد المستحقات بنجاح! المبلغ المدفوع: ${payAmount} ج.م ✅`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    } catch (err) {
      alert('حدث خطأ في التسوية: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة الموردين والمصانع</h1>
          <p style={{ color: 'var(--text-muted)' }}>قائمة بجميع مصانع ومستوردي المنتجات والشركات التي تتعامل معها.</p>
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
            placeholder="البحث باسم المورد، الشركة، أو رقم الهاتف..." 
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
                <th>اسم المورد / الشركة</th>
                <th>الهاتف</th>
                <th>الشخص المسؤول</th>
                <th>المستحقات الحالية (علينا)</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>جاري تحميل الموردين من قاعدة البيانات...</td></tr>
              ) : suppliersList.length > 0 ? (
                suppliersList.map((s) => (
                  <tr key={s._id || s.id}>
                    <td style={{ fontWeight: '600' }}>{s.name} {s.company && s.company !== s.name ? `(${s.company})` : ''}</td>
                    <td>
                      <div className="flex align-center gap-8" style={{ direction: 'ltr', justifyContent: 'flex-end' }}>
                        <span>{s.phone}</span>
                        <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                    <td>
                      <div className="flex align-center gap-8">
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{s.contactPerson || s.contact || 'غير مسجل'}</span>
                      </div>
                    </td>
                    <td>
                      {(s.balance || 0) > 0 ? (
                        <span className="text-danger" style={{ fontWeight: 'bold' }}>
                          مستحق للمورد: {(s.balance || 0).toLocaleString()} ج.م
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>0 ج.م</span>
                      )}
                    </td>
                    <td>
                      <div className="flex align-center justify-center gap-8">
                        {(s.balance || 0) > 0 && (
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ color: 'var(--success)', borderColor: 'var(--success)' }}
                            onClick={() => handleSettleSupplier(s)}
                            title="سداد مستحقات"
                          >
                            <DollarSign size={14} />
                            <span>سداد</span>
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(s)}
                          style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s._id || s.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد موردون مسجلون حالياً</td></tr>
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
              <h3>{editingSupplier ? 'تعديل بيانات مورد' : 'إضافة مورد جديد'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group mb-16">
                <label className="form-label">اسم المورد *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">اسم الشركة / المصنع *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="إذا كان نفس الاسم اتركه مطابقاً"
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">رقم الهاتف *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">الشخص المسؤول (Contact Person)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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

export default Suppliers;
