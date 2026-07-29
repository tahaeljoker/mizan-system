import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderTree, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Download,
  Printer
} from 'lucide-react';
import apiService from '../services/api';

const ChartOfAccounts = () => {
  const [search, setSearch] = useState('');
  const [expandedParents, setExpandedParents] = useState({
    '1000': true,
    '2000': true,
    '3000': true,
    '4000': true,
    '5000': true
  });

  const { data: coaData, isLoading } = useQuery({
    queryKey: ['chartOfAccountsPage'],
    queryFn: () => apiService.finance.getChartOfAccounts()
  });

  const rawList = Array.isArray(coaData) ? coaData : [];
  
  const toggleParent = (code) => {
    setExpandedParents(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  const filteredCoa = rawList.filter(acc => 
    acc.code.includes(search) || acc.name.includes(search)
  );

  // Group accounts by main category
  const mainCategories = filteredCoa.filter(acc => acc.parent === null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['كود الحساب', 'اسم الحساب', 'النوع', 'الحساب الأب', 'الحالة', 'الرصيد الحقيقي'];
    const rows = rawList.map(a => [
      a.code,
      `"${a.name}"`,
      a.type,
      a.parent || 'رئيسي',
      a.status,
      a.balance || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chart_of_accounts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>دليل وشجرة الحسابات (Chart of Accounts)</h1>
          <p style={{ color: 'var(--text-muted)' }}>التسلسل الهيكلي الشجري لجميع الحسابات المالية (الأصول، الالتزامات، الملكية، الإيرادات، والمصروفات).</p>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={18} />
            <span>تصدير الشجرة CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>طباعة الدليل المحاسبي A4</span>
          </button>
        </div>
      </div>

      {/* Search Header */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="header-search" style={{ width: '360px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="البحث باسم الحساب أو الكود المحاسبي..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tree View Structure */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            جاري تحميل شجرة الحسابات...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mainCategories.map(parent => {
              const children = filteredCoa.filter(c => c.parent === parent.code);
              const isExpanded = expandedParents[parent.code];

              return (
                <div key={parent.code} style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Parent Category Header */}
                  <div
                    onClick={() => toggleParent(parent.code)}
                    style={{
                      background: 'var(--bg-app)',
                      padding: '16px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div className="flex align-center gap-12">
                      {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="badge primary" style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>{parent.code}</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{parent.name}</span>
                    </div>

                    <div className="flex align-center gap-16">
                      <span className="badge info">{parent.type}</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        الرصيد: {(parent.balance || 0).toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Children Sub-accounts */}
                  {isExpanded && (
                    <div style={{ padding: '8px 20px 16px 20px', background: '#ffffff' }}>
                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>الكود الفرعي</th>
                              <th>اسم الحساب الفرعي</th>
                              <th>الحساب الأب</th>
                              <th>الحالة</th>
                              <th>الرصيد المتاح الحقيقي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {children.length > 0 ? (
                              children.map(child => (
                                <tr key={child.code}>
                                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold', paddingRight: '24px' }}>
                                    └─ {child.code}
                                  </td>
                                  <td style={{ fontWeight: 'bold' }}>{child.name}</td>
                                  <td><span className="badge secondary">{parent.name} ({parent.code})</span></td>
                                  <td><span className="badge success">نشط</span></td>
                                  <td style={{ fontWeight: 'bold', color: (child.balance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                    {(child.balance || 0).toLocaleString()} ج.م
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                                  لا توجد حسابات فرعية مضافة تحت هذا القسم الرئيسي.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartOfAccounts;
