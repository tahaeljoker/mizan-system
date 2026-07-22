import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { users as initialUsers, branches } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';

const Users = () => {
  // Sync users list with localStorage
  const [usersList, setUsersList] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_users')) || initialUsers;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, id: null });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cashier',
    branch: branches[0]?.name || 'الكل',
    password: '',
    status: 'active'
  });

  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = usersList.filter(u => 
    u.name.includes(searchQuery) || u.email.includes(searchQuery)
  );

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'cashier',
      branch: branches[0]?.name || 'الكل',
      password: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch || 'الكل',
      password: '', 
      status: user.status
    });
    setShowModal(true);
  };

  const handleToggleStatus = (id) => {
    const updated = usersList.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'inactive' : 'active';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem('mizan_users', JSON.stringify(updated));
  };

  const handleDelete = (id) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
    const updated = usersList.filter(u => u.id !== confirmState.id);
    setUsersList(updated);
    localStorage.setItem('mizan_users', JSON.stringify(updated));
    setConfirmState({ isOpen: false, id: null });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      branch: formData.branch,
      status: formData.status
    };

    let updated = [];
    if (editingUser) {
      updated = usersList.map(u => u.id === editingUser.id ? { ...u, ...payload } : u);
    } else {
      updated = [...usersList, { id: 'u' + (usersList.length + 1), ...payload }];
    }
    setUsersList(updated);
    localStorage.setItem('mizan_users', JSON.stringify(updated));
    setShowModal(false);
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'مالك المحل';
      case 'manager': return 'مدير فرع';
      case 'cashier': return 'كاشير مبيعات';
      case 'staff': return 'موظف جرد';
      case 'warehouse': return 'أمين مخزن';
      default: return role;
    }
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة الموظفين والصلاحيات</h1>
          <p style={{ color: 'var(--text-muted)' }}>إضافة كاشيرات، مديري فروع، وتعيين الصلاحيات الخاصة بكل مستخدم.</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>إضافة موظف جديد</span>
        </button>
      </div>

      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '100%' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم الموظف أو البريد الإلكتروني..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>قائمة حسابات الموظفين الحالية</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>البريد الإلكتروني</th>
                <th>الصلاحية / الدور</th>
                <th>الفرع المحدد</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${
                      u.role === 'owner' ? 'success' : 
                      u.role === 'manager' ? 'primary' : 
                      u.role === 'cashier' ? 'secondary' : 'info'
                    }`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td>{u.branch || 'الكل'}</td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(u.id)}
                      className={`badge ${u.status === 'active' ? 'success' : 'danger'}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {u.status === 'active' ? 'نشط' : 'موقوف'}
                    </button>
                  </td>
                  <td>
                    <div className="flex align-center justify-between" style={{ width: '70px', margin: '0 auto' }}>
                      <button 
                        onClick={() => openEditModal(u)}
                        style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
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
              <h3>{editingUser ? 'تعديل صلاحيات موظف' : 'إضافة موظف جديد لـ ميزان'}</h3>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>الاسم الكامل *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>البريد الإلكتروني (لتسجيل الدخول) *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>صلاحية النظام والدور *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="cashier">كاشير (البيع وإصدار الفواتير فقط)</option>
                    <option value="manager">مدير فرع (إدارة المخزون والمبيعات بالفرع)</option>
                    <option value="staff">موظف جرد (استعلام الأسعار والجرد أعمى بالمعرض)</option>
                    <option value="warehouse">أمين مخزن (إدارة واستقبال طلبات الشراء والجرد)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>الفرع المحدد للعمل</label>
                  <select value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                    <option value="الكل">جميع الفروع (للمديرين العامين)</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>كلمة المرور *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      required={!editingUser} 
                      placeholder={editingUser ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" : "6 أحرف على الأقل"}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>حالة الحساب</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">نشط مفعّل</option>
                    <option value="inactive">معطل وموقوف مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
        title="حذف حساب الموظف"
        message="هل أنت متأكد من حذف هذا الحساب نهائياً؟ سيفقد الموظف صلاحيات الدخول فوراً."
        confirmText="حذف الحساب"
        variant="danger"
      />
    </div>
  );
};

export default Users;
