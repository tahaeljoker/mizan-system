import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  ArrowLeftRight,
  ChevronLeft
} from 'lucide-react';
import apiService from '../services/api';

const Ledger = () => {
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: coaData } = useQuery({
    queryKey: ['chartOfAccountsLedger'],
    queryFn: () => apiService.finance.getChartOfAccounts()
  });

  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['generalLedger', selectedAccount, dateFrom, dateTo],
    queryFn: () => apiService.finance.getGeneralLedger({
      accountCode: selectedAccount,
      dateFrom,
      dateTo
    })
  });

  const coaList = Array.isArray(coaData) ? coaData : [];
  const transactions = Array.isArray(ledgerData?.transactions) ? ledgerData.transactions : [];
  const openingBalance = ledgerData?.openingBalance || 0;
  const totalDebit = ledgerData?.totalDebit || 0;
  const totalCredit = ledgerData?.totalCredit || 0;
  const closingBalance = ledgerData?.closingBalance || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['تاريخ القيد', 'رقم القيد', 'كود الحساب', 'اسم الحساب', 'البيان', 'المرجع', 'مدين', 'دائن', 'الرصيد التراكمي'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString('ar-EG'),
      t.entryNumber,
      t.accountCode,
      `"${t.accountName}"`,
      `"${t.description}"`,
      `"${t.reference || ''}"`,
      t.debit,
      t.credit,
      t.runningBalance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `general_ledger_${selectedAccount}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>دفتر الأستاذ العام (General Ledger)</h1>
          <p style={{ color: 'var(--text-muted)' }}>كشف حساب تفصيلي بحركات وحسابات الأستاذ والرصيد التراكمي المستمر.</p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>تصدير CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>طباعة كشف الحساب A4</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="grid-cols-3 gap-12" style={{ alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>اختر الحساب المحاسبي:</label>
            <select
              style={{ width: '100%', padding: '10px 14px' }}
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="ALL">جميع الحسابات (All Accounts)</option>
              {coaList.map(acc => (
                <option key={acc.code} value={acc.code}>{acc.code} - {acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>من تاريخ:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '10px 14px' }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>إلى تاريخ:</label>
            <input
              type="date"
              style={{ width: '100%', padding: '10px 14px' }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid-cols-4 mb-24 gap-16">
        <div className="card stat-card" style={{ padding: '18px' }}>
          <div className="stat-info">
            <span className="stat-title">الرصيد الافتتاحي</span>
            <span className="stat-value">{openingBalance.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '18px', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">إجمالي حركة المدين (Total Debit)</span>
            <span className="stat-value text-success">{totalDebit.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '18px', borderColor: 'rgba(79, 70, 229, 0.3)' }}>
          <div className="stat-info">
            <span className="stat-title">إجمالي حركة الدائن (Total Credit)</span>
            <span className="stat-value text-primary">{totalCredit.toLocaleString()} ج.م</span>
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '18px', borderColor: 'var(--primary-glow)' }}>
          <div className="stat-info">
            <span className="stat-title">الرصيد الختامي الحالي</span>
            <span className="stat-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
              {closingBalance.toLocaleString()} ج.م
            </span>
          </div>
        </div>
      </div>

      {/* General Ledger Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل حركات الأستاذ العام...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>تاريخ القيد</th>
                  <th>رقم القيد</th>
                  <th>الحساب المحاسبي</th>
                  <th>البيان والافتراضات</th>
                  <th>المرجع</th>
                  <th>مدين (Debit)</th>
                  <th>دائن (Credit)</th>
                  <th>الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.date).toLocaleDateString('ar-EG')}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {tx.entryNumber}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>
                        <span className="badge info" style={{ marginLeft: '6px' }}>{tx.accountCode}</span>
                        {tx.accountName}
                      </td>
                      <td style={{ maxWidth: '250px' }}>{tx.description}</td>
                      <td>{tx.reference || '-'}</td>
                      <td style={{ color: tx.debit > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: tx.debit > 0 ? 'bold' : 'normal' }}>
                        {tx.debit > 0 ? tx.debit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                      <td style={{ color: tx.credit > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: tx.credit > 0 ? 'bold' : 'normal' }}>
                        {tx.credit > 0 ? tx.credit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                      <td style={{ fontWeight: 'bold', color: tx.runningBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.runningBalance.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      لا توجد حركات مسجلة في دفتر الأستاذ لهذا الحساب.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-app)', fontWeight: 'bold', fontSize: '14px' }}>
                  <td colSpan="5" style={{ textAlign: 'left' }}>إجمالي الحركات والختامي:</td>
                  <td style={{ color: 'var(--success)' }}>{totalDebit.toLocaleString()} ج.م</td>
                  <td style={{ color: 'var(--primary)' }}>{totalCredit.toLocaleString()} ج.م</td>
                  <td style={{ color: closingBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {closingBalance.toLocaleString()} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;
