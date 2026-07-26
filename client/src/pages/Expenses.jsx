import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, DollarSign, Check, X } from 'lucide-react';
import apiService from '../services/api';

const Expenses = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expensesList'],
    queryFn: () => apiService.finance.getExpenses()
  });

  const { data: categoriesList } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => apiService.finance.getExpenseCategories()
  });

  const expensesList = expensesData?.expenses || expensesData || [];
  const categories = categoriesList || [];

  const [formData, setFormData] = useState({
    notes: '',
    amount: '',
    categoryId: '',
    paymentMethod: 'CASH',
    reference: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => apiService.finance.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesList'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setShowAddModal(false);
      setFormData({
        notes: '',
        amount: '',
        categoryId: '',
        paymentMethod: 'CASH',
        reference: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => apiService.finance.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expensesList'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount) return;

    createExpenseMutation.mutate({
      notes: formData.notes || 'مصروف عام',
      amount: parseFloat(formData.amount) || 0,
      categoryId: formData.categoryId || (categories[0]?._id || null),
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      expenseDate: formData.expenseDate
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل تريد حذف هذا المصروف بالفعل؟')) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const getTotalExpenses = () => {
    return expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة المصاريف المالية والعمومية</h1>
          <p style={{ color: 'var(--text-muted)' }}>تسجيل الإيجار، المرتبات، الفواتير، وحساب صافي الربح الفعلي للمحل.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Expense Stats */}
      <div className="grid-cols-3 mb-24">
        <div className="card stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">إجمالي المصاريف المسجلة</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>
              {getTotalExpenses().toLocaleString()} ج.م
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              عدد السجلات: {expensesList.length}
            </span>
          </div>
          <div className="stat-icon danger">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">فئات المصاريف المعتمدة</span>
            <span className="stat-value" style={{ color: 'var(--primary)' }}>
              {categories.length} فئات
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مبوبة بالنظام المحاسبي</span>
          </div>
          <div className="stat-icon primary">
            <Check size={24} />
          </div>
        </div>

        <div className="card stat-card" style={{ borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">طريقة الخصم المباشر</span>
            <span className="stat-value" style={{ color: 'var(--success)', fontWeight: 'bold' }}>
              خزنة الكاش / البنك
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>توليد قيد مزدوج تلقائي (General Ledger)</span>
          </div>
          <div className="stat-icon success">
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
                <th>الوصف / البيان</th>
                <th>قيمة المصروف</th>
                <th>فئة المصروف</th>
                <th>طريقة الدفع</th>
                <th>تاريخ الصرف</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loadingExpenses ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>جاري تحميل المصاريف من قاعدة البيانات...</td></tr>
              ) : expensesList.length > 0 ? (
                expensesList.map((exp) => (
                  <tr key={exp._id || exp.id}>
                    <td style={{ fontWeight: '600' }}>{exp.notes || exp.name || 'مصروف عام'}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                      {(exp.amount || 0).toLocaleString()} ج.م
                    </td>
                    <td>{exp.categoryId?.name || 'مصروفات عامة'}</td>
                    <td>{exp.paymentMethod || 'CASH'}</td>
                    <td>{new Date(exp.expenseDate || exp.createdAt).toLocaleDateString('ar-EG')}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDelete(exp._id || exp.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مصاريف مسجلة حالياً</td></tr>
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
              <h3>تسجيل مصروف جديد</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-16">
                <label className="form-label">البيان / الوصف *</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: فاتورة كهرباء المحل لشهر يوليو"
                  required
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">المبلغ (ج.م) *</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group mb-16">
                <label className="form-label">فئة المصروف</label>
                <select 
                  className="form-control"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">-- اختر فئة المصروف --</option>
                  {categories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-16">
                <label className="form-label">طريقة الدفع</label>
                <select 
                  className="form-control"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="CASH">نقدية / كاش الخزنة</option>
                  <option value="CARD">بطاقة بنكية / فيزا</option>
                  <option value="INSTAPAY">إنستاباي</option>
                </select>
              </div>
              <div className="form-group mb-24">
                <label className="form-label">تاريخ الصرف</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                />
              </div>
              <div className="flex gap-12 justify-end">
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
