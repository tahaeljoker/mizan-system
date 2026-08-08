import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  ShoppingBag, 
  ArrowLeft, 
  User, 
  Bot, 
  Building2, 
  Check, 
  X,
  ChevronLeft,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import apiService from '../services/api';

const QUESTIONS = [
  {
    id: 'businessType',
    question: 'مرحباً بك! أنا مستشار Orbion الذكي. يسعدني مساعدتك في اختيار الباقة والحل السحابي الأنسب لنشاطك التجارى. بدايةً، ما هو نوع نشاطك؟',
    options: ['مطعم / كافيه', 'سوبرماركت / بقالة', 'محل ملابس وأحذية', 'إلكترونيات وأجهزة', 'مخزن / تجارة جملة', 'مصنع / ورشة', 'شركة / خدمات', 'صيدلية', 'عيادة', 'نشاط آخر']
  },
  {
    id: 'branches',
    question: 'ممتاز جداً! كم عدد الفروع الخاصة بنشاطك التجاري التي ترغب في ربطها بالنظام؟',
    options: ['فرع واحد فقط', '2 إلى 3 فروع', '4 إلى 10 فروع', 'أكثر من 10 فروع']
  },
  {
    id: 'employees',
    question: 'كم عدد الموظفين والكاشيرات المتوقع استخدامهم للنظام؟',
    options: ['1 إلى 2 موظفين', '3 إلى 5 موظفين', '6 إلى 15 موظف', 'أكثر من 15 موظف']
  },
  {
    id: 'needPos',
    question: 'هل تحتاج إلى شاشة كاشير سريعة (POS) لإصدار الفواتير بالبارشود والطباعة الحرارية؟',
    options: ['نعم، أحتاج نقطة بيع POS', 'لا، لا أحتاج شاشة كاشير']
  },
  {
    id: 'hasWarehouse',
    question: 'هل لديك مخزن أو مستودع لمتابعة أرصدة ونواقص البضاعة؟',
    options: ['نعم، لدي مخزن لمتابعة البضاعة', 'لا، لا أحتاج إدارة مخازن']
  },
  {
    id: 'needAccounting',
    question: 'هل تحتاج إلى موديول المحاسبة والقيود المزدوجة ودليل الحسابات وشجرة الأرباح والخسائر؟',
    options: ['نعم، أحتاج محاسبة مالية كاملة', 'لا، اكتفي بمتابعة المصروفات الأساسية']
  },
  {
    id: 'hasSalesReps',
    question: 'هل لديك مندوبين مبيعات وتوزيع ميداني يحتاجون للوصول للنظام؟',
    options: ['نعم، لدي مندوبي مبيعات', 'لا، لا يوجد مندوبين']
  },
  {
    id: 'hasOnlineStore',
    question: 'هل لديك أو تخطط لإنشاء متجر إلكتروني لربطه مع المبيعات والمخزون؟',
    options: ['نعم، لدي أو أرغب في متجر إلكتروني', 'لا، البيع بالمحل فقط']
  },
  {
    id: 'currentSystem',
    question: 'أخيراً، هل تستخدم نظاماً لإدارة محلك حالياً؟',
    options: ['برنامج إكسل (Excel)', 'دفاتر ورقية تقليدية', 'برنامج قديم محلي', 'لا أستخدم أي نظام']
  }
];

const Advisor = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([
    { sender: 'bot', text: QUESTIONS[0].question, options: QUESTIONS[0].options }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);

  // Form Registration State
  const [regForm, setRegForm] = useState({
    companyName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSelectOption = (option) => {
    const currentQ = QUESTIONS[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQ.id]: option };
    setAnswers(newAnswers);

    // Push User Answer Message
    const updatedMessages = [
      ...messages.map(m => ({ ...m, options: null })),
      { sender: 'user', text: option }
    ];
    setMessages(updatedMessages);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < QUESTIONS.length) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setCurrentQuestionIndex(nextIndex);
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: QUESTIONS[nextIndex].question, options: QUESTIONS[nextIndex].options }
        ]);
      }, 700);
    } else {
      // Calculate Rule-Based Recommendation
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        calculateRecommendation(newAnswers);
      }, 1000);
    }
  };

  // Rule-Based Subscription Recommendation Engine
  const calculateRecommendation = (finalAnswers) => {
    const branches = finalAnswers.branches;
    const employees = finalAnswers.employees;
    const needAcc = finalAnswers.needAccounting?.includes('نعم');
    const needPos = finalAnswers.needPos?.includes('نعم');
    const hasReps = finalAnswers.hasSalesReps?.includes('نعم');

    let plan = {
      code: 'BUSINESS',
      name: 'باقة الأعمال (Business)',
      monthlyPrice: 999,
      yearlyPrice: 9990,
      reason: 'الباقة الأكثر توازناً لنشاطك التجارى، توفر إدارة كاملة للمبيعات والمخزون حتى 20 مستخدمين و 5 فروع.',
      features: ['شاشة كاشير POS كاملة', 'حتى 20 مستخدم + 5 فروع', 'إدارة المخزون والتنبيهات بالنواقص', 'موديول المصروفات والمالية', 'دعم فني عبر الواتساب']
    };

    if (branches?.includes('أكثر من 10') || employees?.includes('أكثر من 15')) {
      plan = {
        code: 'ENTERPRISE',
        name: 'باقة المؤسسات (Enterprise)',
        monthlyPrice: 2999,
        yearlyPrice: 29990,
        reason: 'مصممة للشركات الكبرى والمؤسسات ذات الفروع المتعددة، توفر سيرفر مستقل ودعم فني مخصص.',
        features: ['فروع ومستخدمين غير محدودين', 'خادم سحابي خاص ومستقل', 'ربط وتخصيص الدومين الخاص', 'شجرة حسابات وقيود مزدوجة كاملة', 'مدير حساب مخصص وتدريب ميداني']
      };
    } else if (branches?.includes('4 إلى 10') || employees?.includes('6 إلى 15') || needAcc || hasReps) {
      plan = {
        code: 'PRO',
        name: 'الباقة الاحترافية (Professional)',
        monthlyPrice: 1999,
        yearlyPrice: 19990,
        reason: 'تمنحك تحكماً احترافياً كاملاً في الحسابات المالية والقيود المزدوجة والفروع المتعددة.',
        features: ['فروع ومستخدمين غير محدودين', 'أصناف غير محدودة بالمخزن', 'شجرة حسابات وقيود محاسبية مزدوجة', 'موديول الموردين والمشتريات', 'دعم VIP مباشر 24/7']
      };
    } else if (branches?.includes('فرع واحد') && employees?.includes('1 إلى 2') && !needAcc) {
      plan = {
        code: 'STARTER',
        name: 'الباقة المبتدئة (Starter)',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        reason: 'مثالية للمحلات الصغيرة والمشاريع الناشئة التي تحتاج كاشير سريع ومخزون بسيط.',
        features: ['حتى 3 مستخدمين + فرع واحد', 'حتى 500 صنف بضاعة', 'شاشة كاشير POS سريعة', 'طباعة فواتير حرارية 80mm', 'دعم فني عادي']
      };
    }

    setRecommendation(plan);
    setMessages(prev => [
      ...prev,
      { sender: 'bot', text: `بناءً على إجاباتك ودراسة نشاطك التجارى، يسعدني تقديم التوصية التالية للباقة الأنسب لك.` }
    ]);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('كلمات المرور غير متطابقة!');
      return;
    }

    setRegLoading(true);

    try {
      const cleanEmail = regForm.email.trim().toLowerCase();
      const cleanPassword = regForm.password.trim();

      const response = await apiService.saas.registerCompany({
        companyName: regForm.companyName.trim(),
        ownerName: regForm.ownerName.trim(),
        phone: regForm.phone.trim(),
        email: cleanEmail,
        password: cleanPassword
      });

      if (response.success) {
        alert('تم إنشاء حساب شركتك وتفعيل التجربة المجانية بنجاح! 🚀');
        navigate('/login');
      } else {
        setRegError(response.message || 'فشل في تسجيل الشركة');
      }
    } catch (err) {
      setRegError('حدث خطأ في التسجيل: ' + err.message);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="flex align-center gap-12">
          <Link to="/landing" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#fff',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShoppingBag size={20} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Orbion Cloud</span>
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} />
            <span>مستشار Orbion الذكي (Orbion Advisor)</span>
          </span>
        </div>

        <Link to="/landing" className="btn btn-secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>العودة للرئيسية</span>
          <ChevronLeft size={16} />
        </Link>
      </header>

      {/* Progress Line */}
      <div style={{ width: '100%', height: '4px', background: 'var(--border)' }}>
        <div style={{
          height: '100%',
          width: `${((currentQuestionIndex + (recommendation ? 1 : 0)) / QUESTIONS.length) * 100}%`,
          background: 'var(--primary)',
          transition: 'width 0.4s ease'
        }}></div>
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, maxWidth: '800px', width: '100%', margin: '24px auto', padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Messages List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: m.sender === 'user' ? 'flex-start' : 'flex-end',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                flexDirection: m.sender === 'user' ? 'row-reverse' : 'row',
                maxWidth: '85%'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: m.sender === 'user' ? 'var(--secondary)' : 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {m.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                <div style={{
                  background: m.sender === 'user' ? 'var(--primary)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: '14.5px',
                  lineHeight: '1.6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  {m.text}
                </div>
              </div>

              {/* Display Options if present */}
              {m.options && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginRight: '46px', marginTop: '4px' }}>
                  {m.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '13px',
                        padding: '8px 16px',
                        background: '#fff',
                        borderColor: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        fontWeight: '600'
                      }}
                      onClick={() => handleSelectOption(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} />
              </div>
              <div style={{ background: '#ffffff', padding: '12px 18px', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Loader2 size={16} className="spin-animation" />
                <span>مستشار مدار يفكر ويكتب...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Recommendation Card Display */}
        {recommendation && (
          <div className="card" style={{
            padding: '28px',
            border: '2px solid var(--primary)',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg), 0 10px 30px rgba(79, 70, 229, 0.12)',
            marginBottom: '40px'
          }}>
            <div className="flex justify-between align-center mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <span className="badge primary mb-8" style={{ fontSize: '12px' }}>التوصية المخصصة لنشاطك</span>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{recommendation.name}</h2>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)' }}>{recommendation.monthlyPrice} ج.م</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>شهرياً ({recommendation.yearlyPrice} ج.م سنوياً)</div>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              <strong>سبب التوصية:</strong> {recommendation.reason}
            </p>

            <h4 style={{ fontSize: '14.5px', fontWeight: 'bold', marginBottom: '12px' }}>المزايا المضمنة في هذه الباقة:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
              {recommendation.features.map((f, fIdx) => (
                <div key={fIdx} className="flex align-center gap-8" style={{ fontSize: '13.5px' }}>
                  <Check size={16} className="text-success" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              onClick={() => setShowRegModal(true)}
            >
              <Sparkles size={18} />
              <span>ابدأ التجربة المجانية لهذه الباقة (14 يوماً)</span>
            </button>
          </div>
        )}
      </div>

      {/* Company Registration Dialog Modal */}
      {showRegModal && (
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
          padding: '20px',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>إنشاء حساب مؤسسة جديد</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>الباقة المختارة: {recommendation?.name}</p>
              </div>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowRegModal(false)} />
            </div>

            {regError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px' }}>
                {regError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit}>
              <div className="form-group mb-16">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>اسم الشركة / المحل *</label>
                <input
                  type="text"
                  value={regForm.companyName}
                  onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                  placeholder="مثال: بوتيك مودابيلا للملابس"
                  required
                />
              </div>

              <div className="form-group mb-16">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>اسم المالك / المدير *</label>
                <input
                  type="text"
                  value={regForm.ownerName}
                  onChange={(e) => setRegForm({ ...regForm, ownerName: e.target.value })}
                  placeholder="مثال: طه أنس"
                  required
                />
              </div>

              <div className="grid-cols-2 mb-16" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>رقم الهاتف *</label>
                  <input
                    type="text"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="01143632650"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>المدينة</label>
                  <input
                    type="text"
                    value={regForm.city}
                    onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                    placeholder="القاهرة"
                  />
                </div>
              </div>

              <div className="form-group mb-16">
                <label style={{ fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="owner@company.com"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="grid-cols-2 mb-24" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>كلمة المرور *</label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>تأكيد كلمة المرور *</label>
                  <input
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}
                disabled={regLoading}
              >
                {regLoading ? 'جاري إنشاء الحساب والتجميع...' : 'تأكيد إنشاء الحساب والتجربة المجانية'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advisor;
