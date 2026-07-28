import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Scale, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldAlert,
  Search
} from 'lucide-react';
import apiService from '../services/api';

const TrialBalance = () => {
  const [search, setSearch] = useState('');

  const { data: tbData, isLoading } = useQuery({
    queryKey: ['trialBalance'],
    queryFn: () => apiService.finance.getTrialBalance()
  });

  const rawAccounts = tbData?.accounts || tbData || [];
  const accountsList = Array.isArray(rawAccounts) ? rawAccounts : [];
  const totalDebit = tbData?.totalDebit || 0;
  const totalCredit = tbData?.totalCredit || 0;
  const isBalanced = tbData?.isBalanced ?? (Math.abs(totalDebit - totalCredit) < 0.01);

  const filteredAccounts = accountsList.filter(acc => 
    acc.accountCode.includes(search) || acc.accountName.includes(search)
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['كود الحساب', 'اسم الحساب', 'الافتتاحي', 'مدين (Debit)', 'دائن (Credit)', 'الرصيد الختامي'];
    const rows = accountsList.map(a => [
      a.accountCode,
      `"${a.accountName}"`,
      a.opening || 0,
      a.debit || 0,
      a.credit || 0,
      a.closing || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trial_balance_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>ميزان المراجعة (Trial Balance)</h1>
          <p style={{ color: 'var(--text-muted)' }}>مطابقة ومراجعة إجمالي الأرصدة والمدين والدائن لجميع حسابات القوائم المالية.</p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>تصدير CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>طباعة ميزان المراجعة A4</span>
          </button>
        </div>
      </div>

      {/* Balancing Status Banner */}
      <div className="card mb-24" style={{
        padding: '20px',
        border: `2px solid ${isBalanced ? 'var(--success)' : 'var(--danger)'}`,
        background: isBalanced ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
      }}>
        <div className="flex justify-between align-center">
          <div className="flex align-center gap-12">
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: isBalanced ? 'var(--success)' : 'var(--danger)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isBalanced ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: isBalanced ? 'var(--success)' : 'var(--danger)' }}>
                {isBalanced ? 'ميزان المراجعة متوازن ومطابق (Balanced)' : 'ميزان المراجعة غير متوازن (Trial Balance is NOT balanced)'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {isBalanced 
                  ? 'إجمالي جانب المدين يطابق تماماً جانب الدائن طبقاً لمعايير المحاسبة المالية.'
                  : 'تنبيه: هناك فارق بين إجمالي المدين والدائن، يرجى مراجعة وتدقيق القيود اليومية.'}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مجموع المدين: <strong style={{ color: 'var(--success)' }}>{totalDebit.toLocaleString()} ج.م</strong></div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>مجموع الدائن: <strong style={{ color: 'var(--primary)' }}>{totalCredit.toLocaleString()} ج.م</strong></div>
          </div>
        </div>
      </div>

      {/* Search Header */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '320px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="تصفية بكود أو اسم الحساب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Trial Balance Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري احتساب ميزان المراجعة...
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>كود الحساب</th>
                  <th>اسم الحساب المحاسبي</th>
                  <th>النوع</th>
                  <th>الرصيد الافتتاحي</th>
                  <th>حركة المدين (Debit)</th>
                  <th>حركة الدائن (Credit)</th>
                  <th>الرصيد الختامي (Closing)</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.accountCode}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{acc.accountCode}</td>
                      <td style={{ fontWeight: 'bold' }}>{acc.accountName}</td>
                      <td><span className="badge info">{acc.type || 'عام'}</span></td>
                      <td>{(acc.opening || 0).toLocaleString()} ج.م</td>
                      <td style={{ color: acc.debit > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: acc.debit > 0 ? 'bold' : 'normal' }}>
                        {acc.debit > 0 ? acc.debit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                      <td style={{ color: acc.credit > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: acc.credit > 0 ? 'bold' : 'normal' }}>
                        {acc.credit > 0 ? acc.credit.toLocaleString() + ' ج.م' : '-'}
                      </td>
                      <td style={{ fontWeight: 'bold', color: acc.closing >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {acc.closing.toLocaleString()} ج.م
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      لا توجد حسابات مطابقة للتصفية.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--bg-app)', fontWeight: 'bold', fontSize: '15px' }}>
                  <td colSpan="4" style={{ textAlign: 'left' }}>الإجمالي العام لميزان المراجعة:</td>
                  <td style={{ color: 'var(--success)' }}>{totalDebit.toLocaleString()} ج.م</td>
                  <td style={{ color: 'var(--primary)' }}>{totalCredit.toLocaleString()} ج.m</td>
                  <td style={{ color: isBalanced ? 'var(--success)' : 'var(--danger)' }}>
                    {isBalanced ? 'متوازن 100%' : 'فارق: ' + Math.abs(totalDebit - totalCredit).toLocaleString() + ' ج.م'}
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

export default TrialBalance;
