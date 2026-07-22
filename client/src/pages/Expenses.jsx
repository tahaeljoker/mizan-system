import React, { useState } from 'react';
import { Plus, Search, Trash2, DollarSign, Calendar, Tag, Check, CheckSquare, Square } from 'lucide-react';

const Expenses = () => {
  const [expenses, setExpenses] = useState([
    { id: 'exp1', name: 'فاتورة كهرباء المحل', amount: 350, category: 'bills', date: '2026-07-05', deductFromProfit: true },
    { id: 'exp2', name: 'سحب شخصي للمالك', amount: 150, category: 'others', date: '2026-07-10', deductFromProfit: false }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'bills',
    date: new Date().toISOString().split('T')[0],
    deductFromProfit: true
  });

  const [showAddModal, setShowAddModal] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, deductFromProfit: e.target.checked });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const newExpense = {
      id: 'exp' + (expenses.length + 1),
      name: formData.name,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      date: formData.date,
      deductFromProfit: formData.deductFromProfit
    };

    setExpenses([...expenses, newExpense]);
    setShowAddModal(false);
    setFormData({
      name: '',
      amount: '',
      category: 'bills',
      date: new Date().toISOString().split('T')[0],
      deductFromProfit: true
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف هذا المصروف بالفعل؟')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'rent': return 'إيجار المحل';
      case 'bills': return 'فواتير (كهرباء/مياه/إنترنت)';
      case 'salaries': return 'مرتبات موظفين';
      case 'transport': return 'نقل وشحن بضائع';
      default: return 'أخرى';
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getDeductedExpenses = () => {
    return expenses.filter(e => e.deductFromProfit).reduce((sum, e) => sum + e.amount, 0);
  };

  // Mock sales total for shop demo
  const baseSalesProfit = 12500; 

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة المصاريف اليومية</h1>
          <p style={{ color: 'var(--text-muted)' }}>تسجيل الإيجار، المرتبات، الفواتير، وحساب صافي الربح الفعلي للمحل.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Expense Stats */}
      <div className="grid-cols-3">
        <div className="card stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">إجمالي المصاريف المسجلة</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>
              {getTotalExpenses().toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              منها {getDeductedExpenses().toLocaleString()} ج.م تخصم من الأرباح
            </span>
          </div>
          <div className="stat-icon danger">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">أرباح المبيعات الكلية</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              {baseSalesProfit.toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>مجموع مبيعات الفروع المعتمدة</span>
          </div>
          <div className="stat-icon success">
            <Check size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">صافي الربح الفعلي للمحل</span>
            <span className="stat-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {(baseSalesProfit - getDeductedExpenses()).toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              تم استبعاد المصاريف الشخصية غير الخصمية
            </span>
          </div>
          <div className="stat-icon primary">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>تفاصيل المصاريف الأخيرة</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم البند / الوصف</th>
                <th>قيمة المصروف</th>
                <th>فئة المصروف</th>
                <th>حالة خصم الأرباح</th>
                <th>تاريخ الصرف</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: '600' }}>{e.name}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>{e.amount.toLocaleString()} ج.م</td>
                  <td>
                    <div className="flex align-center gap-8">
                      <Tag size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{getCategoryLabel(e.category)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${e.deductFromProfit ? 'danger' : 'secondary'}`}>
                      {e.deductFromProfit ? '✓ يخصم من أرباح المتجر' : '✕ مصروف شخصي لا يخصم'}
                    </span>
                  </td>
                  <td>
                    <div className="flex align-center gap-8">
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{e.date}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(e.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    لم يتم تسجيل أي مصاريف للمحل حالياً!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>تسجيل مصروف جديد للمتجر</h3>
              <Plus className="modal-close" onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>اسم بند المصروف / الوصف *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="مثال: إيجار المحل لشهر يوليو"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>قيمة المبلغ (ج.م) *</label>
                  <input 
                    type="number" 
                    name="amount" 
                    value={formData.amount} 
                    onChange={handleInputChange} 
                    placeholder="مثال: 3000"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>فئة المصروف</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="rent">إيجار المحل</option>
                    <option value="bills">فواتير (كهرباء/مياه/إنترنت)</option>
                    <option value="salaries">مرتبات موظفين</option>
                    <option value="transport">نقل وشحن بضائع</option>
                    <option value="others">أخرى</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>تاريخ الصرف</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="checkbox" 
                    id="deductFromProfit" 
                    name="deductFromProfit"
                    checked={formData.deductFromProfit}
                    onChange={handleCheckboxChange} 
                    style={{ width: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor="deductFromProfit" style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    خصم قيمة هذا المصروف من صافي أرباح المحل
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المصروف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
