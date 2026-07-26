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

  const rawExpenses = expensesData?.data || expensesData?.expenses || expensesData;
  const expensesList = Array.isArray(rawExpenses) ? rawExpenses : [];
  const categories = Array.isArray(categoriesList) ? categoriesList : [];

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
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

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
            <span className="stat-title">أنواع وبنود المصاريف</span>
            <span className="stat-value">{categories.length} فئات</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مرتبات، إيجار، منافع</span>
          </div>
          <div className="stat-icon primary">
            <Plus size={24} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <span className="stat-title">حالة الخزينة النقدية</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>متزنة ومحدثة</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>تحديث تلقائي</span>
          </div>
          <div className="stat-icon success">
            <Check size={24} />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>سجل المصاريف المالية والتشغيلية</h3>

        {loadingExpenses ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل المصاريف...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>تاريخ المصروف</th>
                  <th>بند المصروف</th>
                  <th>البيان والتفاصيل</th>
                  <th>طريقة الدفع</th>
                  <th>المبلغ</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {expensesList.length > 0 ? (
                  expensesList.map((exp) => (
                    <tr key={exp._id || exp.id}>
                      <td>{exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString('ar-EG') : new Date().toLocaleDateString('ar-EG')}</td>
                      <td>
                        <span className="badge warning">
                          {exp.categoryId?.name || exp.category || 'مصروف عام'}
                        </span>
                      </td>
                      <td>{exp.notes || exp.description || 'بدون بيان'}</td>
                      <td>
                        <span className="badge info">{exp.paymentMethod || 'CASH'}</span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>
                        {exp.amount?.toLocaleString()} ج.م
                      </td>
                      <td>
                        <button
                          className="action-btn text-danger"
                          onClick={() => handleDelete(exp._id || exp.id)}
                          title="حذف المصروف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      لا توجد مصاريف مسجلة حتى الآن.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
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
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>تسجيل مصروف جديد</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group mb-16">
                <label>مبلغ المصروف (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group mb-16">
                <label>فئة المصروف</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">اختر الفئة...</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-16">
                <label>طريقة الدفع</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                >
                  <option value="CASH">نقدياً (من الخزينة)</option>
                  <option value="BANK">تحويل بنكي</option>
                  <option value="CARD">بطاقة إلكترونية</option>
                </select>
              </div>

              <div className="form-group mb-24">
                <label>بيان وتفاصيل المصروف</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: فاتورة كهرباء شهر يوليو، إيجار الفرع..."
                />
              </div>

              <div className="flex justify-end gap-12">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={createExpenseMutation.isPending}>
                  {createExpenseMutation.isPending ? 'جاري الحفظ...' : 'حفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
