import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Printer, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  X,
  BookOpen
} from 'lucide-react';
import apiService from '../services/api';

const JournalEntries = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Manual Journal Entry Form State
  const [manualDescription, setManualDescription] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [manualItems, setManualItems] = useState([
    { accountCode: '1001', accountName: 'النقدية والخزينة الرئيسية', debit: 0, credit: 0 },
    { accountCode: '4001', accountName: 'إيرادات مبيعات النشاط التجارى', debit: 0, credit: 0 }
  ]);
  const [formError, setFormError] = useState('');

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['journalEntries', search, statusFilter, sourceFilter, dateFrom, dateTo, page],
    queryFn: () => apiService.finance.getJournalEntries({
      search,
      status: statusFilter,
      referenceType: sourceFilter,
      dateFrom,
      dateTo,
      page,
      limit: 15
    })
  });

  const raw = responseData?.data || responseData?.entries || responseData;
  const entriesList = Array.isArray(raw) ? raw : [];
  const pagination = responseData?.pagination || { page: 1, pages: 1, total: entriesList.length };

  const createEntryMutation = useMutation({
    mutationFn: (data) => apiService.finance.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setShowAddModal(false);
      setManualDescription('');
      setManualReference('');
      setManualItems([
        { accountCode: '1001', accountName: 'النقدية والخزينة الرئيسية', debit: 0, credit: 0 },
        { accountCode: '4001', accountName: 'إيرادات مبيعات النشاط التجارى', debit: 0, credit: 0 }
      ]);
      alert('تم اعتماد وحفظ القيد المحاسبي بنجاح.');
    },
    onError: (err) => {
      setFormError(err.message || 'فشل في حفظ القيد المحاسبي');
    }
  });

  const handleAddItemRow = () => {
    setManualItems([
      ...manualItems,
      { accountCode: '5004', accountName: 'مصروفات تشغيلية وعامة', debit: 0, credit: 0 }
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...manualItems];
    updated[index][field] = value;
    setManualItems(updated);
  };

  const calculateManualTotals = () => {
    let debitSum = 0;
    let creditSum = 0;
    manualItems.forEach(item => {
      debitSum += Number(item.debit || 0);
      creditSum += Number(item.credit || 0);
    });
    return { debitSum, creditSum, isBalanced: Math.abs(debitSum - creditSum) < 0.01 && debitSum > 0 };
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const { debitSum, creditSum, isBalanced } = calculateManualTotals();

    if (!isBalanced) {
      setFormError(`القيد المحاسبي غير متوازن! مجموع المدين: ${debitSum} ج.م، مجموع الدائن: ${creditSum} ج.م`);
      return;
    }

    createEntryMutation.mutate({
      description: manualDescription,
      reference: manualReference,
      referenceType: 'MANUAL',
      items: manualItems
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['رقم القيد', 'التاريخ', 'البيان', 'إجمالي المدين', 'إجمالي الدائن', 'الحالة'];
    const rows = entriesList.map(e => [
      e.entryNumber,
      new Date(e.entryDate || e.createdAt).toLocaleDateString('ar-EG'),
      `"${e.description || ''}"`,
      e.totalDebit,
      e.totalCredit,
      e.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_entries_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>دفتر القيود اليومية (Journal Entries)</h1>
          <p style={{ color: 'var(--text-muted)' }}>مراجعة وتدقيق القيود المحاسبية التلقائية واليدوية بنظام القيد المزدوج.</p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>تصدير CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span>إضافة قيد محاسبي جديد</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="grid-cols-4 gap-12" style={{ alignItems: 'center' }}>
          <div className="header-search" style={{ width: '100%' }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="بحث برقم القيد أو البيان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              style={{ width: '100%', padding: '10px 14px' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="">جميع المصادر (Source Types)</option>
              <option value="SALE">مبيعات (SALE)</option>
              <option value="PURCHASE">مشتريات (PURCHASE)</option>
              <option value="EXPENSE">مصروفات (EXPENSE)</option>
              <option value="CUSTOMER_PAYMENT">تحصيل عميل (CUSTOMER_PAYMENT)</option>
              <option value="SUPPLIER_PAYMENT">سداد مورد (SUPPLIER_PAYMENT)</option>
              <option value="BANK_TRANSFER">تحويل بنكي (BANK_TRANSFER)</option>
              <option value="STOCK_ADJUSTMENT">تسوية مخزون (STOCK_ADJUSTMENT)</option>
              <option value="MANUAL">قيد يدوئ (MANUAL)</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              style={{ width: '100%', padding: '10px 14px' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <input
              type="date"
              style={{ width: '100%', padding: '10px 14px' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل القيود المحاسبية...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>رقم القيد</th>
                  <th>التاريخ</th>
                  <th>البيان والتفاصيل</th>
                  <th>أنشئ بواسطة</th>
                  <th>مجموع المدين (Debit)</th>
                  <th>مجموع الدائن (Credit)</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {entriesList.length > 0 ? (
                  entriesList.map((entry) => (
                    <tr key={entry._id || entry.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {entry.entryNumber}
                      </td>
                      <td>{new Date(entry.entryDate || entry.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td style={{ maxWidth: '280px', fontWeight: '600' }}>{entry.description || 'قيد محاسبي'}</td>
                      <td>{entry.createdBy?.name || 'النظام التلقائي'}</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                        {(entry.totalDebit || 0).toLocaleString()} ج.م
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                        {(entry.totalCredit || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        <span className="badge success">مرحل ومكتمل</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => { setSelectedEntry(entry); setShowViewModal(true); }}
                        >
                          <Eye size={14} />
                          <span>معاينة التفاصيل</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      لا توجد قيود محاسبية مسجلة طبقاً للتصفية الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Journal Entry Details Modal */}
      {showViewModal && selectedEntry && (
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
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <span className="badge primary mb-4" style={{ fontSize: '11px' }}>تفاصيل القيد المحاسبي</span>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{selectedEntry.entryNumber}</h3>
              </div>
              <div className="flex gap-8 align-center">
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handlePrint}>
                  <Printer size={14} />
                  <span>طباعة A4</span>
                </button>
                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowViewModal(false)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-app)', padding: '14px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px' }}>
              <div><strong>تاريخ القيد:</strong> {new Date(selectedEntry.entryDate || selectedEntry.createdAt).toLocaleDateString('ar-EG')}</div>
              <div><strong>المرجع:</strong> {selectedEntry.reference || 'N/A'}</div>
              <div><strong>المصدر:</strong> {selectedEntry.referenceType || 'MANUAL'}</div>
              <div><strong>المستخدم:</strong> {selectedEntry.createdBy?.name || 'النظام التلقائي'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>البيان:</strong> {selectedEntry.description}</div>
            </div>

            {/* Entry Items Breakdown Table */}
            <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '12px' }}>أطراف القيد المحاسبي (Double Entry Breakdown):</h4>
            <div className="table-container mb-20">
              <table>
                <thead>
                  <tr>
                    <th>كود الحساب</th>
                    <th>اسم الحساب</th>
                    <th>مدين (Debit)</th>
                    <th>دائن (Credit)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedEntry.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.accountCode}</td>
                      <td style={{ fontWeight: 'bold' }}>{item.accountName}</td>
                      <td style={{ color: item.debit > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: item.debit > 0 ? 'bold' : 'normal' }}>
                        {item.debit > 0 ? item.debit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                      <td style={{ color: item.credit > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: item.credit > 0 ? 'bold' : 'normal' }}>
                        {item.credit > 0 ? item.credit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-app)', fontWeight: 'bold' }}>
                    <td colSpan="2" style={{ textAlign: 'left' }}>الإجمالي الكلي:</td>
                    <td style={{ color: 'var(--success)' }}>{(selectedEntry.totalDebit || 0).toLocaleString()} ج.م</td>
                    <td style={{ color: 'var(--primary)' }}>{(selectedEntry.totalCredit || 0).toLocaleString()} ج.م</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '10px', color: 'var(--success)', fontSize: '13px', fontWeight: 'bold' }}>
              <span className="flex align-center gap-6">
                <CheckCircle2 size={16} />
                <span>القيد متوازن ومستوفي للشروط المحاسبية (Total Debit = Total Credit)</span>
              </span>
              <span>الحالة: POSTED</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Journal Entry Modal */}
      {showAddModal && (
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
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>إصدار قيد محاسبي يدوئ جديد</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowAddModal(false)} />
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleManualSubmit}>
              <div className="grid-cols-2 mb-16" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label>البيان / الشرح التفصيلي للقيد *</label>
                  <input
                    type="text"
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="مثال: اثبات شراء أثاث ومستلزمات مكتبية"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>رقم المرجع (Reference)</label>
                  <input
                    type="text"
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    placeholder="رقم الفاتورة أو المستند"
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>أطراف القيد المحاسبي:</h4>
              {manualItems.map((item, idx) => (
                <div key={idx} className="flex gap-8 mb-8" style={{ alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="كود الحساب"
                    style={{ width: '90px' }}
                    value={item.accountCode}
                    onChange={(e) => handleItemChange(idx, 'accountCode', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="اسم الحساب"
                    style={{ flex: 2 }}
                    value={item.accountName}
                    onChange={(e) => handleItemChange(idx, 'accountName', e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    placeholder="مدين"
                    style={{ flex: 1 }}
                    value={item.debit}
                    onChange={(e) => handleItemChange(idx, 'debit', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="دائن"
                    style={{ flex: 1 }}
                    value={item.credit}
                    onChange={(e) => handleItemChange(idx, 'credit', Number(e.target.value))}
                  />
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary mb-20"
                style={{ fontSize: '12px', marginTop: '4px' }}
                onClick={handleAddItemRow}
              >
                + إضافة طرف قيد آخر
              </button>

              {/* Live Totals & Balance Check */}
              {(() => {
                const { debitSum, creditSum, isBalanced } = calculateManualTotals();
                return (
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: isBalanced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: isBalanced ? 'var(--success)' : 'var(--danger)',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>إجمالي المدين: {debitSum.toLocaleString()} ج.م | إجمالي الدائن: {creditSum.toLocaleString()} ج.م</div>
                    <div>{isBalanced ? 'القيد متوازن' : 'غير متوازن!'}</div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-12">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending ? 'جاري الاعتماد...' : 'اعتماد وحفظ القيد المحاسبي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntries;
