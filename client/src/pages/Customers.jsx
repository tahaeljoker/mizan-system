import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, X, Phone, Mail, DollarSign, Coins, FileText, Printer, Download } from 'lucide-react';
import apiService from '../services/api';

const Customers = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Account Statement Modal state
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);

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

  // Customer Ledger Query
  const { data: ledgerData, isLoading: loadingLedger } = useQuery({
    queryKey: ['customerLedger', selectedStatementCustomer?._id || selectedStatementCustomer?.id],
    queryFn: () => apiService.customers.getLedger(selectedStatementCustomer._id || selectedStatementCustomer.id),
    enabled: !!selectedStatementCustomer
  });

  const rawTransactions = ledgerData?.data || ledgerData?.transactions || ledgerData;
  const statementTransactions = Array.isArray(rawTransactions) ? rawTransactions : [];

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

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      loyaltyPoints: c.loyaltyPoints || '0'
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت تأكد من حذف العميل؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomer) {
      updateMutation.mutate({
        id: editingCustomer._id || editingCustomer.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openStatement = (customer) => {
    setSelectedStatementCustomer(customer);
    setShowStatementModal(true);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleExportStatementCSV = () => {
    const headers = ['تاريخ الحركة', 'نوع المعاملة', 'البيان والمرجع', 'المبلغ', 'الرصيد التراكمي'];
    const rows = statementTransactions.map(t => [
      new Date(t.createdAt || t.date).toLocaleDateString('ar-EG'),
      t.type || 'فاتورة/سداد',
      `"${t.reference || 'معاملة آجل'}"`,
      t.amount || 0,
      t.balanceAfter || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_statement_${selectedStatementCustomer.name}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة العملاء وكشوف الحسابات</h1>
          <p style={{ color: 'var(--text-muted)' }}>متابعة بيانات العملاء، النقاط، المستحقات الآجلة، وكشوف الحسابات التفصيلية.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '320px' }}>
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
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل قائمة العملاء...
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
                  <th>الرصيد المستحق (آجل)</th>
                  <th>كشف الحساب والإجراءات</th>
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
                        <span className="badge warning flex align-center gap-4" style={{ display: 'inline-flex' }}>
                          <Coins size={14} />
                          <span>{c.loyaltyPoints || 0} نقطة</span>
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: (c.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {(c.balance || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openStatement(c)}
                          >
                            <FileText size={14} />
                            <span>كشف حساب</span>
                          </button>
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

      {/* Add / Edit Customer Modal */}
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

      {/* Customer Account Statement Modal */}
      {showStatementModal && selectedStatementCustomer && (
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
                <span className="badge primary mb-4" style={{ fontSize: '11px' }}>كشف حساب عميل مفصل</span>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedStatementCustomer.name}</h3>
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
              <div><strong>رقم الهاتف:</strong> {selectedStatementCustomer.phone || 'غير مسجل'}</div>
              <div><strong>البريد الإلكتروني:</strong> {selectedStatementCustomer.email || 'غير مسجل'}</div>
              <div><strong>نقاط الولاء:</strong> {selectedStatementCustomer.loyaltyPoints || 0} نقطة</div>
              <div><strong>الرصيد المتبقي المستحق:</strong> <strong style={{ color: (selectedStatementCustomer.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>{(selectedStatementCustomer.balance || 0).toLocaleString()} ج.م</strong></div>
            </div>

            <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '12px' }}>سجل الفواتير والمقبوضات والمرتجعات:</h4>
            
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
                          <td>{tx.reference || tx.notes || 'فاتورة آجل'}</td>
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
                          لا توجد معاملات مسجلة في كشف حساب العميل حالياً.
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

export default Customers;
