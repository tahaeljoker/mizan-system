import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X, Phone, User, DollarSign, FileText, Printer, Download } from 'lucide-react';
import apiService from '../services/api';

const Suppliers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Supplier Statement State
  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  
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

  const raw = suppliersData?.data || suppliersData?.suppliers || suppliersData;
  const suppliersList = Array.isArray(raw) ? raw : [];

  // Supplier Ledger Query
  const { data: ledgerData, isLoading: loadingLedger } = useQuery({
    queryKey: ['supplierLedger', selectedStatementSupplier?._id || selectedStatementSupplier?.id],
    queryFn: () => apiService.suppliers.getLedger(selectedStatementSupplier._id || selectedStatementSupplier.id),
    enabled: !!selectedStatementSupplier
  });

  const rawTransactions = ledgerData?.data || ledgerData?.transactions || ledgerData;
  const statementTransactions = Array.isArray(rawTransactions) ? rawTransactions : [];

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

  const openEditModal = (s) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name || '',
      company: s.company || '',
      phone: s.phone || '',
      contactPerson: s.contactPerson || '',
      balance: s.balance || '0'
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت تأكد من حذف المورد؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingSupplier) {
      updateMutation.mutate({
        id: editingSupplier._id || editingSupplier.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openStatement = (supplier) => {
    setSelectedStatementSupplier(supplier);
    setShowStatementModal(true);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleExportStatementCSV = () => {
    const headers = ['تاريخ الحركة', 'نوع المعاملة', 'البيان والمرجع', 'المبلغ', 'الرصيد التراكمي'];
    const rows = statementTransactions.map(t => [
      new Date(t.createdAt || t.date).toLocaleDateString('ar-EG'),
      t.type || 'توريد/سداد',
      `"${t.reference || 'فاتورة توريد آجل'}"`,
      t.amount || 0,
      t.balanceAfter || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `supplier_statement_${selectedStatementSupplier.name}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة الموردين وفواتير الشراء</h1>
          <p style={{ color: 'var(--text-muted)' }}>بيانات الموردين، المستحقات المالية للدائنين، وكشوف الحسابات التفصيلية.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '320px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="البحث باسم المورد أو الشركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل قائمة الموردين...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>اسم المورد</th>
                  <th>اسم الشركة</th>
                  <th>رقم الهاتف</th>
                  <th>مسؤول الاتصال</th>
                  <th>المستحقات للدائن (الرصيد)</th>
                  <th>كشف الحساب والإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {suppliersList.length > 0 ? (
                  suppliersList.map((s) => (
                    <tr key={s._id || s.id}>
                      <td style={{ fontWeight: 'bold' }}>{s.name}</td>
                      <td>{s.company || 'غير مسجل'}</td>
                      <td>{s.phone || 'غير مسجل'}</td>
                      <td>{s.contactPerson || 'غير مسجل'}</td>
                      <td style={{ fontWeight: 'bold', color: (s.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {(s.balance || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openStatement(s)}
                          >
                            <FileText size={14} />
                            <span>كشف حساب</span>
                          </button>
                          <button className="action-btn text-primary" onClick={() => openEditModal(s)} title="تعديل">
                            <Edit size={16} />
                          </button>
                          <button className="action-btn text-danger" onClick={() => handleDelete(s._id || s.id)} title="حذف">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      لا يوجد موردون مسجلون حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
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
                {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-16">
                <label>اسم المورد *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مصنع الأمل للتوريدات"
                  required
                />
              </div>

              <div className="form-group mb-16">
                <label>اسم الشركة</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="شركة الأمل غزل ونسيج"
                />
              </div>

              <div className="form-group mb-16">
                <label>رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01123456789"
                />
              </div>

              <div className="form-group mb-16">
                <label>اسم مسؤول الاتصال</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="أستاذ طارق"
                />
              </div>

              <div className="flex justify-end gap-12 mt-24">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المورد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Account Statement Modal */}
      {showStatementModal && selectedStatementSupplier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <span className="badge primary mb-4" style={{ fontSize: '11px' }}>كشف حساب مورد مفصل</span>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedStatementSupplier.name}</h3>
              </div>
              <div className="flex gap-8 align-center">
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleExportStatementCSV}>
                  <Download size={14} />
                  <span>تصدير CSV</span>
                </button>
                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handlePrintStatement}>
                  <Printer size={14} />
                  <span>طباعة A4</span>
                </button>
                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowStatementModal(false)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
              <div><strong>الشركة:</strong> {selectedStatementSupplier.company || 'غير مسجل'}</div>
              <div><strong>رقم الهاتف:</strong> {selectedStatementSupplier.phone || 'غير مسجل'}</div>
              <div><strong>مسؤول الاتصال:</strong> {selectedStatementSupplier.contactPerson || 'غير مسجل'}</div>
              <div><strong>رصيد مستحقات المورد:</strong> <strong style={{ color: (selectedStatementSupplier.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>{(selectedStatementSupplier.balance || 0).toLocaleString()} ج.م</strong></div>
            </div>

            <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '12px' }}>سجل توريدات الشراء والمدفوعات والمرتجعات:</h4>
            
            {loadingLedger ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>جاري تحميل كشف الحساب...</div>
            ) : (
              <div className="table-container mb-20">
                <table>
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>النوع</th>
                      <th>البيان والمرجع</th>
                      <th>المبلغ</th>
                      <th>الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementTransactions.length > 0 ? (
                      statementTransactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td>{new Date(tx.createdAt || tx.date).toLocaleDateString('ar-EG')}</td>
                          <td><span className="badge info">{tx.type || 'معاملة'}</span></td>
                          <td>{tx.reference || tx.notes || 'فاتورة توريد آجل'}</td>
                          <td style={{ fontWeight: 'bold', color: tx.amount < 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {(tx.amount || 0).toLocaleString()} ج.م
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {(tx.balanceAfter || 0).toLocaleString()} ج.م
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                          لا توجد معاملات مسجلة في كشف حساب المورد حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
