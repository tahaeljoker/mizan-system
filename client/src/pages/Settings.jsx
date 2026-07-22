import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Store, Receipt, ShieldAlert, Sparkles, Shield, Moon } from 'lucide-react';

const Settings = () => {
  const [shopSettings, setShopSettings] = useState({
    name: 'مِيزان للبيع والتوزيع',
    slogan: 'ملابسك الأنيقة هنا',
    phone: '01098765432',
    address: 'الفرع الرئيسي - المهندسين',
    currency: 'ج.م',
    taxPercent: '0'
  });

  const [receiptSettings, setReceiptSettings] = useState({
    headerText: 'مرحبا بكم في ميزان',
    footerText: 'شكراً لزيارتكم! المرتجع خلال 14 يوماً بالإيصال.',
    showLogo: true,
    showTaxId: false,
    taxIdNumber: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    maxDiscount: '10',
    requirePinForVoid: true
  });

  const user = JSON.parse(localStorage.getItem('mizan_user')) || null;
  const themeKey = user ? `mizan_theme_${user.email || user.role}` : 'mizan_theme';

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem(themeKey) || 'light';
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSaveShop = (e) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleToggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem(themeKey, newTheme);
    if (newTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm('⚠️ تحذير خطير: هل أنت متأكد من مسح جميع بيانات النظام (الفواتير، المخازن، الفروع) للبدء من الصفر؟ لا يمكن التراجع عن هذا الإجراء!')) {
      const currentTheme = localStorage.getItem(themeKey);
      localStorage.clear();
      if (currentTheme) localStorage.setItem(themeKey, currentTheme);
      alert('تم مسح جميع البيانات بنجاح! سيتم إعادة تحميل النظام.');
      window.location.href = '/';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إعدادات النظام</h1>
          <p style={{ color: 'var(--text-muted)' }}>تخصيص هوية محلك، الفواتير المطبوعة، وإعداد الضريبة والعملة.</p>
        </div>
        {savedMsg && (
          <span className="badge success" style={{ padding: '8px 16px', fontSize: '14px' }}>
            تم حفظ التعديلات بنجاح!
          </span>
        )}
      </div>

      <div className="grid-cols-2">
        {/* Shop Settings */}
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} className="text-primary" />
            <span>بيانات المتجر والمحل التجارية</span>
          </h3>

          <form onSubmit={handleSaveShop}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>اسم المحل (يظهر بالواجهة) *</label>
                <input 
                  type="text" 
                  value={shopSettings.name} 
                  onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>شعار المحل / الـ Slogan</label>
                <input 
                  type="text" 
                  value={shopSettings.slogan} 
                  onChange={(e) => setShopSettings({ ...shopSettings, slogan: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>رقم هاتف التواصل الرئيسي</label>
                <input 
                  type="text" 
                  value={shopSettings.phone} 
                  onChange={(e) => setShopSettings({ ...shopSettings, phone: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>العنوان الرئيسي للمركز</label>
                <input 
                  type="text" 
                  value={shopSettings.address} 
                  onChange={(e) => setShopSettings({ ...shopSettings, address: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>العملة الافتراضية للمعاملات</label>
                <select value={shopSettings.currency} onChange={(e) => setShopSettings({ ...shopSettings, currency: e.target.value })}>
                  <option value="ج.م">الجنيه المصري (ج.م)</option>
                  <option value="USD">الدولار الأمريكي ($)</option>
                  <option value="SAR">الريال السعودي (ر.س)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '10px' }}>
                <Save size={16} />
                <span>حفظ بيانات المتجر</span>
              </button>
            </div>
          </form>
        </div>

        {/* Invoice settings */}
        <div className="card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={20} className="text-secondary" />
            <span>تنسيق الفاتورة الحرارية (80mm)</span>
          </h3>

          <form onSubmit={handleSaveShop}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>نص أعلى الفاتورة (Header)</label>
                <input 
                  type="text" 
                  value={receiptSettings.headerText} 
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, headerText: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label>نص أسفل الفاتورة (Footer)</label>
                <textarea 
                  rows="3" 
                  value={receiptSettings.footerText} 
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, footerText: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group">
                <label>نسبة ضريبة القيمة المضافة (%)</label>
                <input 
                  type="number" 
                  value={shopSettings.taxPercent} 
                  onChange={(e) => setShopSettings({ ...shopSettings, taxPercent: e.target.value })} 
                  placeholder="0 للمحلات المعفاة"
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={receiptSettings.showTaxId} 
                  onChange={(e) => setReceiptSettings({ ...receiptSettings, showTaxId: e.target.checked })} 
                  style={{ width: 'auto', cursor: 'pointer' }}
                  id="showTaxId"
                />
                <label htmlFor="showTaxId" style={{ cursor: 'pointer' }}>تفعيل الرقم الضريبي للمحل بالفاتورة</label>
              </div>

              {receiptSettings.showTaxId && (
                <div className="form-group">
                  <label>الرقم الضريبي الموحد</label>
                  <input 
                    type="text" 
                    value={receiptSettings.taxIdNumber} 
                    onChange={(e) => setReceiptSettings({ ...receiptSettings, taxIdNumber: e.target.value })} 
                    placeholder="مثال: 123-456-789"
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '10px' }}>
                <Save size={16} />
                <span>حفظ إعدادات الفاتورة</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security & Theme Settings */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} className="text-warning" />
            <span>سياسات الأمان والمظهر (Security & UI)</span>
          </h3>

          <form onSubmit={handleSaveShop}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>الحد الأقصى للخصم (للكاشير) %</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={securitySettings.maxDiscount} 
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxDiscount: e.target.value })} 
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>بدون صلاحية مدير</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Moon size={18} style={{ color: themeMode === 'dark' ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>الوضع الداكن (Dark Mode)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>مريح للعين أثناء العمل الليلي</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleToggleTheme}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    border: 'none', 
                    background: themeMode === 'dark' ? 'var(--primary)' : '#e2e8f0',
                    color: themeMode === 'dark' ? '#fff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: '0.2s'
                  }}
                >
                  {themeMode === 'dark' ? 'مفعل ✓' : 'معطل'}
                </button>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  <Save size={16} />
                  <span>حفظ وتطبيق السياسات</span>
                </button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <h4 style={{ color: 'var(--danger)', marginBottom: '10px' }}>المنطقة الخطرة (Danger Zone)</h4>
            <button 
              type="button" 
              onClick={handleFactoryReset}
              className="btn btn-danger" 
              style={{ width: '100%', padding: '12px' }}
            >
              <ShieldAlert size={18} />
              <span>إعادة ضبط المصنع (مسح كل البيانات التجريبية)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
