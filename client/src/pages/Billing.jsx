import React, { useState } from 'react';
import { CreditCard, Send, Sparkles, AlertCircle, CheckCircle, Image as ImageIcon, Copy, Share2 } from 'lucide-react';
import { billingInfo } from '../data/mockData';

const Billing = () => {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [formData, setFormData] = useState({
    name: '',
    shopName: '',
    phone: '',
    transactionId: '',
    screenshot: null
  });
  const [submitted, setSubmitted] = useState(false);

  // Referral Program & Addons states
  const [promoCode, setPromoCode] = useState('');
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [promoFeedback, setPromoFeedback] = useState('');
  const [addonCashiers, setAddonCashiers] = useState(false);
  const [addonBranches, setAddonBranches] = useState(false);
  const [addonProducts, setAddonProducts] = useState(false);

  // Dynamic pricing plans load from localStorage
  const plansConfig = JSON.parse(localStorage.getItem('mizan_plans_config')) || [
    { id: 'starter', name: 'الباقة المبتدئة (Starter)', price: 99, maxUsers: 2, maxBranches: 1, maxProducts: 500, support: 'دعم فني عادي' },
    { id: 'business', name: 'باقة الأعمال (Business)', price: 199, maxUsers: 5, maxBranches: 3, maxProducts: 2000, support: 'دعم فني سريع' },
    { id: 'pro', name: 'الباقة الاحترافية (Professional)', price: 349, maxUsers: 15, maxBranches: 10, maxProducts: 99999, support: 'دعم فني متواصل 24/7' },
    { id: 'lifetime', name: 'العميل الدائم (Lifetime)', price: 4999, maxUsers: 999, maxBranches: 999, maxProducts: 99999, support: 'دعم VIP مباشر وسرعة استجابة فائقة' }
  ];

  const plans = plansConfig.map(p => ({
    id: p.id,
    name: p.name,
    price: p.id === 'lifetime' ? `${p.price} ج.م (مرة واحدة)` : `${p.price} ج.م / شهرياً`,
    features: [
      `${p.maxUsers} موظفين`,
      p.maxBranches === 1 ? 'فرع واحد فقط' : `${p.maxBranches} فروع مختلفة`,
      p.maxProducts >= 99999 ? 'عدد غير محدود من المنتجات' : `${p.maxProducts} منتج كحد أقصى`,
      p.support
    ]
  }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, screenshot: e.target.files[0] });
  };

  const verifyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoFeedback('');
      setIsPromoApplied(false);
      return;
    }

    // Prefilled or valid codes, e.g. MIZAN15, MODABELLA10, or taha's number
    const code = promoCode.trim().toUpperCase();
    if (code === 'MIZAN15' || code === 'MODABELLA10' || code === 'TAHA450' || code === '01143632650') {
      setIsPromoApplied(true);
      setPromoFeedback('✓ تم تطبيق خصم الزملاء والعملاء 15% بنجاح! 🎉');
    } else {
      setIsPromoApplied(false);
      setPromoFeedback('✕ كود ترويجي غير صالح! يرجى التحقق من الكود.');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('من فضلك املأ البيانات الأساسية للتواصل!');
      return;
    }
    setSubmitted(true);
  };

  // Pricing calculations
  const basePrice = plansConfig.find(p => p.id === selectedPlan)?.price || 99;
  const addonsTotal = (addonCashiers ? 20 : 0) + (addonBranches ? 50 : 0) + (addonProducts ? 30 : 0);
  const subTotal = basePrice + addonsTotal;
  const discountAmount = isPromoApplied ? Math.round(subTotal * 0.15) : 0;
  const finalTotal = subTotal - discountAmount;

  const copyReferralCode = () => {
    navigator.clipboard.writeText('TAHA450');
    alert('تم نسخ كود دعوتك الشخصي (TAHA450) للذاكرة! أرسله لزملائك التجار للحصول على شهر مجاني. 🔗');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة الاشتراك والترقية</h1>
          <p style={{ color: 'var(--text-muted)' }}>متابعة حالة اشتراكك، وتجديد حسابك عبر تحويلات InstaPay.</p>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(99, 102, 241, 0.05))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>باقة اشتراك المحل الحالية</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '6px 0', color: 'var(--primary)' }}>
              {billingInfo.currentPlan}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--warning)' }}>
              <AlertCircle size={16} />
              <span>فترة التجربة المجانية نشطة. تنتهي في {billingInfo.trialEnds}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <span className="badge success" style={{ padding: '8px 16px', fontSize: '14px' }}>
              الحالة: نشط وتجريبي
            </span>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Banner for Merchant */}
      <div className="card mb-24" style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(59, 130, 246, 0.03))', 
        border: '1px dashed var(--success)', 
        padding: '20px', 
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={18} />
            <span>تسويق ميزان بالعمولة - اكسب شهراً مجانياً!</span>
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            أرسل كود الدعوة الشخصي لزملائك التجار. عند اشتراكهم، يحصلون على <strong>خصم 15%</strong> وتحصل أنت على <strong>شهر مجاني كامل</strong> يُضاف لحسابك!
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--text-main)' }}>
            TAHA450
          </div>
          <button onClick={copyReferralCode} className="btn btn-secondary" style={{ padding: '10px 14px', fontSize: '13px', display: 'flex', gap: '6px', color: 'var(--success)', borderColor: 'var(--success)' }}>
            <Copy size={14} />
            <span>نسخ الكود</span>
          </button>
        </div>
      </div>

      {submitted ? (
        <div className="card text-center" style={{ padding: '48px', borderColor: 'var(--success)' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--success-glow)', color: 'var(--success)', borderRadius: '50%', marginBottom: '24px' }}>
            <CheckCircle size={48} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>تم إرسال إيصال الدفع بنجاح!</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 16px auto', fontSize: '15px' }}>
            شكراً لك! لقد استلمنا إشعار تحويل الباقة المطلوبة بقيمة <strong>{finalTotal} ج.م</strong>. سيقوم فريق ميزان بمراجعة الإيصال وتأكيد المعاملة يدويًا وتفعيل حسابك خلال ساعة واحدة كحد أقصى.
          </p>
          <div style={{ fontSize: '13px', color: 'var(--text-dark)' }}>
            يمكنك متابعة التفعيل عبر رقم التليفون المسجل: <strong>{formData.phone}</strong>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: '24px' }} onClick={() => setSubmitted(false)}>
            إرسال إيصال آخر
          </button>
        </div>
      ) : (
        <div className="grid-cols-3" style={{ alignItems: 'start' }}>
          {/* Form container */}
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} className="text-primary" />
              <span>تجديد الاشتراك أو الترقية</span>
            </h3>

            {/* InstaPay instructions */}
            <div style={{ background: 'rgba(99, 102, 241, 0.04)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px' }}>
              <h4 style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--primary)' }}>خطوات الدفع والتحويل:</h4>
              <ol style={{ paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-muted)' }}>
                <li>قم بالدخول على تطبيق <strong>InstaPay</strong> على هاتفك.</li>
                <li>قم بإرسال قيمة التحويل إلى العنوان التالي:</li>
                <li style={{ listStyle: 'none', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '4px', margin: '4px 0', border: '1px dashed var(--border)', direction: 'ltr', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                  {billingInfo.instapay.address}
                </li>
                <li>أو التحويل على رقم الهاتف: <strong style={{ color: 'var(--text-main)' }}>{billingInfo.instapay.phone}</strong></li>
                <li>اسم المستلم بالتطبيق: <strong style={{ color: 'var(--text-main)' }}>{billingInfo.instapay.ownerName}</strong></li>
                <li>بعد إتمام التحويل، خذ لقطة شاشة (Screenshot) للإيصال واملأ النموذج بالأسفل.</li>
              </ol>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>اسم صاحب المحل *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>اسم المحل التجاري *</label>
                  <input type="text" name="shopName" value={formData.shopName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>رقم الهاتف للتواصل *</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>رقم المعاملة الفريد (InstaPay Ref)</label>
                  <input type="text" name="transactionId" value={formData.transactionId} onChange={handleInputChange} placeholder="مثال: TXN778901234" />
                </div>
                
                {/* Plan select */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>اختر الباقة المراد التجديد بها</label>
                  <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
                    {plansConfig.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.id === 'lifetime' ? `${p.price} ج.م (مدى الحياة)` : `${p.price} ج.م / شهرياً`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subscription Flex Add-ons */}
                {selectedPlan !== 'lifetime' && (
                  <div className="form-group" style={{ gridColumn: 'span 2', background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block', color: 'var(--text-main)' }}>ملحقات إضافية مرنة لحسابك (Add-ons)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="flex align-center gap-8">
                        <input 
                          type="checkbox" 
                          id="addon-cashier" 
                          checked={addonCashiers} 
                          onChange={(e) => setAddonCashiers(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="addon-cashier" style={{ cursor: 'pointer', fontSize: '13px' }}>
                          موظف كاشير إضافي (+20 ج.م / شهر)
                        </label>
                      </div>

                      <div className="flex align-center gap-8">
                        <input 
                          type="checkbox" 
                          id="addon-branch" 
                          checked={addonBranches} 
                          onChange={(e) => setAddonBranches(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="addon-branch" style={{ cursor: 'pointer', fontSize: '13px' }}>
                          فرع إضافي للمخزن (+50 ج.م / شهر)
                        </label>
                      </div>

                      <div className="flex align-center gap-8">
                        <input 
                          type="checkbox" 
                          id="addon-products" 
                          checked={addonProducts} 
                          onChange={(e) => setAddonProducts(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="addon-products" style={{ cursor: 'pointer', fontSize: '13px' }}>
                          سعة +500 منتج إضافية في القائمة (+30 ج.م / شهر)
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referral Promo Code Input */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>هل لديك كود دعوة زملاء (خصم 15%)؟</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={promoCode} 
                      onChange={(e) => setPromoCode(e.target.value)} 
                      placeholder="أدخل كود الخصم (مثال: TAHA450)" 
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={verifyPromoCode}
                      style={{ padding: '8px 16px' }}
                    >
                      تفعيل الكود
                    </button>
                  </div>
                  {promoFeedback && (
                    <span style={{ fontSize: '12px', color: isPromoApplied ? 'var(--success)' : 'var(--danger)', marginTop: '4px', fontWeight: 'bold' }}>
                      {promoFeedback}
                    </span>
                  )}
                </div>

                {/* Billing invoice breakdown */}
                <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>تفاصيل الفاتورة المطلوبة:</label>
                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="flex justify-between">
                      <span>سعر الباقة الأساسي:</span>
                      <strong>{basePrice} ج.م</strong>
                    </div>
                    {addonsTotal > 0 && (
                      <div className="flex justify-between">
                        <span>إجمالي الملحقات الإضافية:</span>
                        <strong style={{ color: 'var(--primary)' }}>+{addonsTotal} ج.م</strong>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between" style={{ color: 'var(--success)' }}>
                        <span>خصم دعوة الزملاء (15%):</span>
                        <strong>-{discountAmount} ج.م</strong>
                      </div>
                    )}
                    <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      <span>إجمالي القيمة المطلوب تحويلها:</span>
                      <span style={{ color: 'var(--primary)', fontSize: '18px' }}>{finalTotal} ج.م</span>
                    </div>
                  </div>
                </div>

                {/* Proof screenshot upload */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>إرفاق إثبات الدفع (لقطة الشاشة) *</label>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-input)' }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} id="screenshot-upload" required />
                    <label htmlFor="screenshot-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                      <ImageIcon size={32} />
                      <span>{formData.screenshot ? formData.screenshot.name : 'اضغط لرفع صورة إيصال التحويل'}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ border: 'none', padding: 0, marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Send size={16} />
                  <span>إرسال إثبات التحويل للتفعيل المباشر</span>
                </button>
              </div>
            </form>
          </div>

          {/* Pricing cards info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {plans.map((p) => (
              <div 
                key={p.id} 
                className="card" 
                style={{ 
                  border: selectedPlan === p.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: selectedPlan === p.id ? 'linear-gradient(135deg, var(--bg-card), rgba(99, 102, 241, 0.02))' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transform: selectedPlan === p.id ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedPlan(p.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{p.name}</h4>
                  {selectedPlan === p.id && <span className="badge success">محدد</span>}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '12px' }}>{p.price}</div>
                <ul style={{ paddingRight: '20px', fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {p.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
