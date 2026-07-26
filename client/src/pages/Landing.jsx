import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Store, 
  Check, 
  HelpCircle, 
  Mail, 
  Phone, 
  ArrowLeft,
  Sparkles,
  Users,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactSuccess(false), 4000);
  };

  const faqs = [
    { q: 'ما هي منصة مدار ERP/POS؟', a: 'منصة مدار هي نظام سحابي متكامل لإدارة المبيعات، الكاشير، المخازن، الحسابات المالية، والفروع المتعددة مناسب للأنشطة التجارية والمحلات والسوبرماركت والملابس.' },
    { q: 'هل يمكنني تجربة المنصة مجاناً قبل الاشتراك؟', a: 'نعم! تمنحك منصة مدار فترة تجريبية مجانية لمدة 14 يوماً بكافة الصلاحيات والمزايا دون الحاجة لبطاقة ائتمان.' },
    { q: 'هل النظام يدعم العمل بالفواتير الضريبية والطباعة الحرارية؟', a: 'بالتأكيد، مدار يدعم الفواتير الضريبية طابعات الإيصالات 80mm وطابعات A4 والباربود وحسابات القيمة المضافة.' },
    { q: 'هل البيانات آمنة على مدار السحابية؟', a: 'بياناتك مشفرة ومحفوظة بنسبة 100% على خوادم سحابية فائقة السرعة مع نسخ احتياطي يومي وتشفير SSL.' }
  ];

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl', background: '#f8fafc', minHeight: '100vh', color: 'var(--text-main)' }}>
      {/* Header Navigation */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        zIndex: 1000,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="flex align-center gap-12">
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShoppingBag size={22} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>مِدار ERP/POS</span>
        </div>

        <nav className="flex align-center gap-24" style={{ fontSize: '14px', fontWeight: '600' }}>
          <a href="#features" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>المميزات</a>
          <a href="#pricing" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>الباقات والأسعار</a>
          <a href="#faq" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>الأسئلة الشائعة</a>
          <a href="#contact" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>تواصل معنا</a>
        </nav>

        <div className="flex align-center gap-12">
          <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13.5px' }}>
            تسجيل الدخول
          </Link>
          <Link to="/login" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '13.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Sparkles size={16} />
            <span>تجربة المنصة مجاناً</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.12) 0%, rgba(248, 250, 252, 1) 70%)'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(79, 70, 229, 0.1)',
            color: 'var(--primary)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}>
            <Zap size={16} />
            <span>الجيل الجديد لبرامج الكاشير وإدارة المحلات بالسحابة ⚡</span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.3', color: '#0f172a', marginBottom: '20px' }}>
            أدر محلك وتجارتك بكل سهولة وسرعة مع <span style={{ color: 'var(--primary)' }}>منصة مدار ERP</span>
          </h1>

          <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '36px' }}>
            نظام سحابي متكامل يجمع بين الكاشير السريع، الجرد المخزني، حسابات الموردين والعملاء، القيود المالية، والتقارير التنفيذية اللحظية.
          </p>

          <div className="flex justify-center align-center gap-16">
            <Link to="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>ابدأ التجربة المجانية الان</span>
              <ArrowLeft size={18} />
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px', borderRadius: '10px' }}>
              استكشف المزايا
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '12px' }}>كل ما تحتاجه لإدارة نشاطك التجاري في مكان واحد</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>مصمم خصيصاً لتلبية احتياجات السوق العربي والمحلات التجارية</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>كاشير POS فائق السرعة</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6' }}>إصدار الفواتير بالبارشود بنقرة واحدة، دعم الطرق المتعددة للدفع (كاش، فيزا، إنستاباي، آجل)، وتعليق الفواتير.</p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Store size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>إدارة المخزون والفروع</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6' }}>متابعة كميات البضاعة، التحويلات بين الفروع، تنبيهات النواقص، الجرد الدوري المستمر واستيراد البارشود.</p>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <BarChart3 size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>المالية والقيود المزدوجة</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6' }}>دفتر أستاذ عام، شجرة حسابات، تسجيل المصروفات، حركة الخزينة والبنك، وقائمة الأرباح والخسائر اللحظية.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '60px 20px', background: '#ffffff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '12px' }}>باقات اشتراك مرنة تناسب جميع الأحجام</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>اختر الباقة المناسبة لمتجرك وابدأ فوراً</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div className="card" style={{ padding: '28px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>الباقة المبتدئة</h3>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', marginBottom: '16px' }}>99 ج.م <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/شهرياً</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>مستخدم واحد + فرع واحد</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>حتى 500 صنف بضاعة</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>شاشة كاشير POS كاملة</span></li>
              </ul>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>اختر الباقة المبتدئة</Link>
            </div>

            <div className="card" style={{ padding: '28px', border: '2px solid var(--primary)', textAlign: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-12px', right: '50%', transform: 'translateX(50%)', background: 'var(--primary)', color: '#fff', fontSize: '11px', padding: '2px 12px', borderRadius: '10px', fontWeight: 'bold' }}>الأكثر طلباً ⭐</span>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>باقة الأعمال</h3>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', marginBottom: '16px' }}>199 ج.م <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/شهرياً</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>حتى 5 مستخدمين + 3 فروع</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>حتى 2,000 صنف بضاعة</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>موديول المالية والمصروفات</span></li>
              </ul>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>تجربة باقة الأعمال</Link>
            </div>

            <div className="card" style={{ padding: '28px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>الباقة الاحترافية</h3>
              <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', marginBottom: '16px' }}>349 ج.م <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/شهرياً</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>حتى 15 مستخدم + 10 فروع</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>أصناف غير محدودة</span></li>
                <li className="flex align-center gap-8"><Check size={16} className="text-success" /> <span>دعم VIP متواصل 24/7</span></li>
              </ul>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>اختر الاحترافية</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>الأسئلة الشائعة</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>إليك إجابات لأبرز الأسئلة حول منصة مدار السحابية</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => (
            <div key={idx} className="card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => toggleFaq(idx)}>
              <div className="flex justify-between align-center">
                <h4 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <HelpCircle size={18} className="text-primary" />
                  <span>{faq.q}</span>
                </h4>
                <ChevronDown size={18} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: '1.6', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '60px 20px', background: '#ffffff', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>تواصل مع فريق الدعم الفني والمبيعات</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>يسعدنا الرد على جميع استفساراتك ومساعدتك في اختيار الباقة المناسبة</p>

          {contactSuccess && (
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px', fontSize: '13.5px' }}>
              تم استلام رسالتك بنجاح! سيتواصل معك أحد ممثلي المبيعات في أقرب وقت. 🎉
            </div>
          )}

          <form onSubmit={handleContactSubmit} style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>الاسم بالكامل</label>
              <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني</label>
              <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>نص الرسالة</label>
              <textarea rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'var(--font-ar)' }}></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '15px' }}>إرسال الرسالة</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 20px', fontSize: '13px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px 0' }}>جميع الحقوق محفوظة © 2026 منصة مدار ERP/POS السحابية.</p>
        <p style={{ margin: 0 }}>تشفير بيانات عالي الأمان | بنية متعددة المستأجرين (Multi-Tenant Architecture)</p>
      </footer>
    </div>
  );
};

export default Landing;
