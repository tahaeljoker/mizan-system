import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  ShoppingBag,
  Store,
  ShieldCheck
} from 'lucide-react';
import apiService from '../services/api';

const Register = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    industry: 'ملابس وأحذية',
    city: 'القاهرة',
    branches: '1',
    plan: 'STARTER',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    setError('');

    if (step === 1) {
      if (!formData.companyName.trim()) {
        setError('يرجى كتابة اسم الشركة أو المحل التجارى.');
        return;
      }
    } else if (step === 2) {
      // Plan selected, move to step 3
    }

    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (cleanPassword !== formData.confirmPassword.trim()) {
      setError('كلمات المرور غير متطابقة!');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.saas.registerCompany({
        companyName: formData.companyName.trim(),
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        email: cleanEmail,
        password: cleanPassword
      });

      if (response.success) {
        // Automatically attempt login for smooth onboarding
        try {
          const loginRes = await apiService.auth.login(cleanEmail, cleanPassword);
          if (loginRes.success && onLoginSuccess) {
            onLoginSuccess(loginRes.user);
            navigate('/dashboard');
            return;
          }
        } catch (loginErr) {
          console.warn('Auto-login fallback after register:', loginErr.message);
        }

        alert('تم إنشاء حساب شركتك وتفعيل التجربة المجانية 14 يوماً بنجاح!');
        navigate('/login');
      } else {
        setError(response.message || 'فشل في تسجيل الشركة');
      }
    } catch (err) {
      const apiErr = err.response?.data?.message || err.message;
      setError(apiErr || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: 'var(--font-ar)',
      direction: 'rtl',
      background: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12) 0%, rgba(248, 250, 252, 1) 80%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={24} />
            </div>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>Orbion ERP Cloud</span>
          </Link>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-main)', margin: '4px 0' }}>
            إنشاء حساب مؤسسة جديد (14 يوماً تجربة مجانية)
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            خطوات بسيطة وسريعة لتجهيز سيرفر نشاطك التجاري والبدء فوراً
          </p>
        </div>

        {/* Wizard Progress Indicator */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            
            {/* Progress line */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              height: '2px',
              background: 'var(--border)',
              zIndex: 1,
              transform: 'translateY(-50%)'
            }}>
              <div style={{
                height: '100%',
                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%',
                background: 'var(--primary)',
                transition: 'width 0.4s ease'
              }}></div>
            </div>

            {/* Step 1 */}
            <div style={{ zIndex: 2, background: '#fff', padding: '0 8px', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: step >= 1 ? 'var(--primary)' : 'var(--bg-app)',
                color: step >= 1 ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                margin: '0 auto 4px auto'
              }}>
                1
              </div>
              <span style={{ fontSize: '12px', fontWeight: step === 1 ? 'bold' : 'normal', color: step === 1 ? 'var(--primary)' : 'var(--text-muted)' }}>بيانات النشاط</span>
            </div>

            {/* Step 2 */}
            <div style={{ zIndex: 2, background: '#fff', padding: '0 8px', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: step >= 2 ? 'var(--primary)' : 'var(--bg-app)',
                color: step >= 2 ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                margin: '0 auto 4px auto'
              }}>
                2
              </div>
              <span style={{ fontSize: '12px', fontWeight: step === 2 ? 'bold' : 'normal', color: step === 2 ? 'var(--primary)' : 'var(--text-muted)' }}>الباقة والتجربة</span>
            </div>

            {/* Step 3 */}
            <div style={{ zIndex: 2, background: '#fff', padding: '0 8px', textAlign: 'center' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: step >= 3 ? 'var(--primary)' : 'var(--bg-app)',
                color: step >= 3 ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                margin: '0 auto 4px auto'
              }}>
                3
              </div>
              <span style={{ fontSize: '12px', fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? 'var(--primary)' : 'var(--text-muted)' }}>حساب المالك</span>
            </div>
          </div>
        </div>

        {/* Wizard Form Container */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          padding: '32px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}

          {/* STEP 1: Business Information */}
          {step === 1 && (
            <form onSubmit={handleNextStep}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Store size={20} className="text-primary" />
                <span>الخطوة 1: معلومات الشركة والمحل التجارى</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                حدد اسم شركتك ومجال التجارة لتهيئة الإعدادات الافتراضية
              </p>

              <div className="form-group mb-16">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>اسم الشركة / المحل التجارى *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="مثال: أسواق الخير / بوتيك مودابيلا"
                  required
                  autoFocus
                />
              </div>

              <div className="grid-cols-2 mb-16" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>مجال النشاط التجارى</label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                    <option value="ملابس وأحذية">ملابس وأحذية</option>
                    <option value="سوبرماركت وبقالة">سوبرماركت وبقالة</option>
                    <option value="مطعم وكافيه">مطعم وكافيه</option>
                    <option value="إلكترونيات وأجهزة">إلكترونيات وأجهزة</option>
                    <option value="مخزن وجملة">مخزن وتجارة جملة</option>
                    <option value="خدمات ومصنع">خدمات ومصنع</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>المدينة / المحافظة</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="القاهرة"
                  />
                </div>
              </div>

              <div className="form-group mb-28">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>عدد الفروع المخطط ربطها بالنظام</label>
                <select value={formData.branches} onChange={(e) => setFormData({ ...formData, branches: e.target.value })}>
                  <option value="1">فرع واحد فقط (1 Branch)</option>
                  <option value="2-3">من 2 إلى 3 فروع</option>
                  <option value="4-10">من 4 إلى 10 فروع</option>
                  <option value="10+">أكثر من 10 فروع (سلسلة)</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <span>المتابعة لاختيار الباقة والتجربة</span>
                <ArrowLeft size={18} />
              </button>
            </form>
          )}

          {/* STEP 2: Plan Selection */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Sparkles size={20} className="text-primary" />
                <span>الخطوة 2: اختيار الباقة وفترة التجربة السحابية</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                تحصل جميع الباقات على تجربة مجانية كاملة لمدة 14 يوماً بدون أي رسوم
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {/* Plan 1 */}
                <div 
                  onClick={() => setFormData({ ...formData, plan: 'STARTER' })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formData.plan === 'STARTER' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.plan === 'STARTER' ? 'rgba(79, 70, 229, 0.04)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>باقة المبتدئة (Starter) — 499 ج.م / شهر</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>مناسبة للمحلات والأنشطة الناشئة (فرع واحد + POS ومخزون)</div>
                  </div>
                  {formData.plan === 'STARTER' && <CheckCircle2 size={22} className="text-primary" />}
                </div>

                {/* Plan 2 */}
                <div 
                  onClick={() => setFormData({ ...formData, plan: 'BUSINESS' })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formData.plan === 'BUSINESS' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.plan === 'BUSINESS' ? 'rgba(79, 70, 229, 0.04)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--primary)' }}>باقة الأعمال (Business - الأكثر شعبية) — 999 ج.م / شهر</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>تغطي حتى 5 فروع + محاسبة مزدوجة ودليل حسابات كامل</div>
                  </div>
                  {formData.plan === 'BUSINESS' && <CheckCircle2 size={22} className="text-primary" />}
                </div>

                {/* Plan 3 */}
                <div 
                  onClick={() => setFormData({ ...formData, plan: 'PRO' })}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: formData.plan === 'PRO' ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: formData.plan === 'PRO' ? 'rgba(79, 70, 229, 0.04)' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>الباقة الاحترافية (Professional) — 1,999 ج.م / شهر</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>فروع غير محدودة + مستشار الذكاء الاصطناعي وربط الـ API</div>
                  </div>
                  {formData.plan === 'PRO' && <CheckCircle2 size={22} className="text-primary" />}
                </div>
              </div>

              <div className="flex gap-12">
                <button type="button" onClick={handlePrevStep} className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '14px' }}>
                  رجوع
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <span>المتابعة لإنشاء حساب المالك</span>
                  <ArrowLeft size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Owner Credentials */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ShieldCheck size={20} className="text-primary" />
                <span>الخطوة 3: حساب المالك وبيانات تسجيل الدخول</span>
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                أدخل بياناتك الشخصية كمدير ومسؤول للنظام
              </p>

              <div className="form-group mb-16">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>اسم المالك / المدير *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="مثال: طه أنس"
                    style={{ paddingRight: '40px' }}
                    required
                    autoFocus
                  />
                  <User size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="grid-cols-2 mb-16" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>رقم الهاتف للتواصل *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="01143632650"
                      style={{ paddingRight: '40px', direction: 'ltr' }}
                      required
                    />
                    <Phone size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="owner@company.com"
                      style={{ paddingRight: '40px', direction: 'ltr' }}
                      required
                    />
                    <Mail size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              <div className="grid-cols-2 mb-24" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>كلمة المرور *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      style={{ paddingRight: '40px', direction: 'ltr' }}
                      required
                    />
                    <Lock size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>تأكيد كلمة المرور *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      style={{ paddingRight: '40px', direction: 'ltr' }}
                      required
                    />
                    <Lock size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-12">
                <button type="button" onClick={handlePrevStep} className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '14px' }}>
                  رجوع
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: 'bold' }} disabled={loading}>
                  {loading ? 'جاري تجهيز سيرفر وحساب شركتك...' : 'تأكيد التسجيل وبدء التجربة المجانية'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', textAlign: 'center', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            <span>لديك حساب بالفعل؟ </span>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
              تسجيل الدخول للنظام
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
