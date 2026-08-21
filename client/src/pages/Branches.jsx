import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, MapPin, Phone, User, Truck, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { branches as initialBranches, products as initialProducts } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';

const Branches = () => {
  const user = JSON.parse(localStorage.getItem('mizan_user')) || { role: 'owner' };
  const [branchesList, setBranchesList] = useState(initialBranches);
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, id: null });
  const [transferConfirm, setTransferConfirm] = useState({ isOpen: false, transferId: null, branchName: '' });

  // Branch Transfer States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transfers, setTransfers] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_transfers')) || [];
  });

  const [transferForm, setTransferForm] = useState({
    fromBranch: initialBranches[0]?.name || '',
    toBranch: initialBranches[1]?.name || '',
    productId: initialProducts[0]?.id || '',
    qty: 1
  });

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  const filteredBranches = branchesList.filter(b => 
    b.name.includes(searchQuery) || b.address.includes(searchQuery)
  );

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      manager: ''
    });
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      manager: branch.manager
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
    setBranchesList(branchesList.filter(b => b.id !== confirmState.id));
    setConfirmState({ isOpen: false, id: null });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      manager: formData.manager
    };

    if (editingBranch) {
      setBranchesList(branchesList.map(b => b.id === editingBranch.id ? { ...b, ...payload } : b));
    } else {
      setBranchesList([...branchesList, { id: 'b' + (branchesList.length + 1), ...payload }]);
    }
    setShowModal(false);
  };

  // Stock Transfer Actions
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (transferForm.fromBranch === transferForm.toBranch) {
      alert('لا يمكن تحويل البضائع لنفس الفرع! يرجى تحديد فرع مستقبل مختلف.');
      return;
    }

    const selectedProd = productsList.find(p => p.id === transferForm.productId);
    if (!selectedProd) return;

    if (selectedProd.stock < transferForm.qty) {
      alert(`عذراً! الكمية المطلوبة غير متوفرة في الفرع المصدر. المتاح: ${selectedProd.stock} قطعة.`);
      return;
    }

    const newTransfer = {
      id: 'tr' + (transfers.length + 1),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      from: transferForm.fromBranch,
      to: transferForm.toBranch,
      product: selectedProd.name,
      qty: transferForm.qty,
      status: 'pending'
    };

    const updatedTransfers = [newTransfer, ...transfers];
    setTransfers(updatedTransfers);
    localStorage.setItem('mizan_transfers', JSON.stringify(updatedTransfers));
    setShowTransferModal(false);
    alert('تم تسجيل طلب التحويل بنجاح! هو الآن معلق وبانتظار شحن واستلام الفرع الآخر. 🚚');
  };

  const handleConfirmReceipt = (transferId) => {
    const tr = transfers.find(t => t.id === transferId);
    setTransferConfirm({ isOpen: true, transferId, branchName: tr?.to || '' });
  };

  const doConfirmReceipt = () => {
    const updatedTransfers = transfers.map(tr =>
      tr.id === transferConfirm.transferId ? { ...tr, status: 'completed', receiveDate: new Date().toISOString().replace('T', ' ').substring(0, 16) } : tr
    );
    setTransfers(updatedTransfers);
    localStorage.setItem('mizan_transfers', JSON.stringify(updatedTransfers));
    
    // Add Notification
    const log = JSON.parse(localStorage.getItem('mizan_notifications_log')) || [];
    const notificationText = `تم استلام البضاعة بالكامل في فرع (${transferConfirm.branchName}) ✔️`;
    log.unshift({
      text: notificationText,
      type: 'success',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    localStorage.setItem('mizan_notifications_log', JSON.stringify(log));

    setTransferConfirm({ isOpen: false, transferId: null, branchName: '' });
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة فروع المحلات والمخازن</h1>
          <p style={{ color: 'var(--text-muted)' }}>لوحة المتابعة الجغرافية لفروع البيع، نقل البضائع ومقارنة الأداء.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)} style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
            <ArrowRightLeft size={18} />
            <span>نقل بضاعة بين الفروع 🚚</span>
          </button>
          
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>إضافة فرع جديد</span>
          </button>
        </div>
      </div>

      {/* Branch Stats comparison overview */}
      <div className="grid-cols-3 mb-24">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي عدد فروعك</span>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px' }}>{branchesList.length} فروع</h3>
            </div>
            <div className="stat-icon primary"><MapPin size={24} /></div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مبيعات الفروع الكلية (اليوم)</span>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--success)' }}>12,500 ج.م</h3>
            </div>
            <div className="stat-icon success"><TrendingUp size={24} /></div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>شحنات النقل النشطة قيد التوصيل</span>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '6px', color: 'var(--warning)' }}>
                {transfers.filter(t => t.status === 'pending').length} شحنات
              </h3>
            </div>
            <div className="stat-icon warning"><Truck size={24} /></div>
          </div>
        </div>
      </div>

      <div className="grid-cols-3" style={{ alignItems: 'start' }}>
        {/* Branches Cards Layout */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '16px', marginBottom: 0 }}>
            <div className="header-search" style={{ width: '100%' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="البحث باسم الفرع أو العنوان لمطابقة حركة النقل..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '16px' }}>
            {filteredBranches.map((b) => (
              <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
                <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--primary)' }}>{b.name}</h3>
                  <div className="flex gap-8">
                    <button 
                      onClick={() => openEditModal(b)}
                      style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                      title="تعديل"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(b.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '16px' }}>
                  <div className="flex align-center gap-8">
                    <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>العنوان: {b.address}</span>
                  </div>
                  <div className="flex align-center gap-8">
                    <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ direction: 'ltr' }}>تليفون الفرع: {b.phone}</span>
                  </div>
                  <div className="flex align-center gap-8">
                    <User size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>مدير الفرع: {b.manager}</span>
                  </div>
                </div>

                {/* Owner specific Branch Reports */}
                {user?.role === 'owner' && (
                  <div style={{ 
                    borderTop: '1px solid var(--border)', 
                    paddingTop: '16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                  }}>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>مبيعات الفرع (اليوم)</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--success)' }}>
                        {(Math.floor(Math.random() * 5000) + 1000).toLocaleString()} ج.م
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>حجم المخزون</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {Math.floor(Math.random() * 500) + 100} قطعة
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>صافي الربح التقديري (الشهر)</span>
                        <TrendingUp size={14} className="text-primary" />
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {(Math.floor(Math.random() * 20000) + 10000).toLocaleString()} ج.م
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Branch stock transfer log */}
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} className="text-primary" />
            <span>سجل تحويلات البضائع الحالي</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '480px', overflowY: 'auto' }}>
            {transfers.map((tr) => (
              <div key={tr.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                  <span>{tr.product}</span>
                  <span style={{ color: 'var(--primary)' }}>{tr.qty} قطع</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0' }}>
                  من: {tr.from} <br />
                  إلى: {tr.to}
                </div>
                <div className="flex justify-between align-center" style={{ marginTop: '8px' }}>
                  <span className={`badge ${tr.status === 'completed' ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                    {tr.status === 'completed' ? '✓ تم الاستلام' : '⏳ قيد التوصيل'}
                  </span>
                  
                  {tr.status === 'pending' && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      onClick={() => handleConfirmReceipt(tr.id)}
                    >
                      تأكيد الاستلام بالفرع
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Branch Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBranch ? 'تعديل بيانات فرع' : 'إضافة فرع جديد'}</h3>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>اسم الفرع *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="مثال: فرع وسط البلد"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>العنوان بالتفصيل *</label>
                  <input 
                    type="text" 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    placeholder="المحافظة، اسم الشارع، علامة مميزة"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>رقم هاتف الفرع</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>اسم مدير الفرع</label>
                  <input 
                    type="text" 
                    value={formData.manager} 
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ الفرع</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>طلب تحويل ونقل بضائع بين الفروع 🚚</h3>
              <X className="modal-close" onClick={() => setShowTransferModal(false)} />
            </div>

            <form onSubmit={handleTransferSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>الفرع المصدر المرسِل *</label>
                  <select 
                    value={transferForm.fromBranch} 
                    onChange={(e) => setTransferForm({ ...transferForm, fromBranch: e.target.value })}
                  >
                    {branchesList.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>الفرع المستهدف المستقبل *</label>
                  <select 
                    value={transferForm.toBranch} 
                    onChange={(e) => setTransferForm({ ...transferForm, toBranch: e.target.value })}
                  >
                    {branchesList.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>اختر الصنف المراد تحويله *</label>
                  <select 
                    value={transferForm.productId} 
                    onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  >
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (المخزون الحالي: {p.stock} {p.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>الكمية المطلوب تحويلها *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={transferForm.qty} 
                    onChange={(e) => setTransferForm({ ...transferForm, qty: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تأكيد شحن البضاعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
        title="حذف الفرع"
        message="هل أنت متأكد من حذف هذا الفرع نهائياً؟ ستفقد جميع بياناته وسجلات التحويلات."
        confirmText="حذف الفرع"
        variant="danger"
      />
      <ConfirmModal
        isOpen={transferConfirm.isOpen}
        onConfirm={doConfirmReceipt}
        onCancel={() => setTransferConfirm({ isOpen: false, transferId: null, branchName: '' })}
        title="تأكيد استلام البضائع"
        message={`هل تؤكد أن فرع «${transferConfirm.branchName}» استلم البضائع بالكامل؟ سيتم تحديث مخزون الفرع تلقائياً.`}
        confirmText="تأكيد الاستلام"
        variant="info"
      />
    </div>
  );
};

export default Branches;
