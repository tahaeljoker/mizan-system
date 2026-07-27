import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  Check, 
  HelpCircle, 
  Mail, 
  Phone, 
  MapPin,
  ArrowLeft,
  Sparkles,
  Users,
  ChevronDown,
  Boxes,
  Calculator,
  Truck,
  CreditCard,
  Building2,
  Bell,
  Cloud,
  Star,
  CheckCircle2,
  XCircle,
  Globe,
  Bot,
  Flame,
  Award,
  Clock,
  Headphones,
  RefreshCw,
  Lock,
  Smartphone,
  CheckCircle,
  Building
} from 'lucide-react';
import PricingCalculator from '../components/PricingCalculator';

const Landing = () => {
  const navigate = useNavigate();

  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Animated Counter Effect Hook
  const useCountUp = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [end, duration]);
    return count;
  };

  const companiesCount = useCountUp(520);
  const invoicesCount = useCountUp(14800);
  const transactionsCount = useCountUp(985000);
  const branchesCount = useCountUp(1250);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactForm({ name: '', email: '', phone: '', message: '' });
    setTimeout(() => setContactSuccess(false), 4000);
  };

  // Section Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  // 12 Core Modules Grid
  const modulesList = [
    { icon: <Zap className="text-primary" size={26} />, title: 'نقاط البيع POS', desc: 'كاشير سريعة للغاية تعمل بالبارشود، تعليق الفواتير، ودعم طرق الدفع المتعددة (كاش، كارت، إنستاباي).' },
    { icon: <Boxes style={{ color: '#10b981' }} size={26} />, title: 'إدارة المخزون', desc: 'متابعة كميات المنتجات بالمخازن اللحظية، التنبيهات بالنواقص، والجرد المستمر.' },
    { icon: <Calculator style={{ color: '#f59e0b' }} size={26} />, title: 'المحاسبة والقيود', desc: 'شجرة حسابات، دفتر أستاذ عام، قيود مزدوجة، وقائمة الأرباح والخسائر اللحظية.' },
    { icon: <Truck style={{ color: '#3b82f6' }} size={26} />, title: 'المشتريات والموردين', desc: 'إصدار أوامر الشراء، فواتير التوريد، ومتابعة حسابات الموردين والدفعات المستحقة.' },
    { icon: <TrendingUp style={{ color: '#8b5cf6' }} size={26} />, title: 'إدارة المبيعات', desc: 'سجل الفواتير الكامل، خصومات الاصناف، المرتجعات، وتحليلات المبيعات اليومية.' },
    { icon: <Users style={{ color: '#ec4899' }} size={26} />, title: 'إدارة العملاء والولاء', desc: 'سجل العملاء، المديونيات المستحقة، ونظام نقاط المكافآت التلقائي.' },
    { icon: <Building2 style={{ color: '#06b6d4' }} size={26} />, title: 'الفروع المتعددة', desc: 'ربط ومتابعة جميع فروع نشاطك التجاري والتحويلات المخزنية بين الفروع.' },
    { icon: <CreditCard style={{ color: '#14b8a6' }} size={26} />, title: 'الخزينة والبنك', desc: 'إدارة السندات النقدية، الإيداعات والبنوك، وتتبع التدفقات النقدية اللحظية.' },
    { icon: <BarChart3 style={{ color: '#6366f1' }} size={26} />, title: 'التقارير والتحليلات', desc: 'أكثر من 100 تقرير تفصيلي وشاشات تحليلات تنفيذية اتخاذ قرارات فورية.' },
    { icon: <Bell style={{ color: '#f43f5e' }} size={26} />, title: 'التنبيهات الذكية', desc: 'إشعارات آلية بالنواقص، الفواتير المعلقة، الشيفتات، ومواعيد تجديد الاشتراكات.' },
    { icon: <Cloud style={{ color: '#0284c7' }} size={26} />, title: 'النسخ الاحتياطي السحابي', desc: 'تشفير وحفظ تلقائي يومي لبياناتك السحابية دون خوف من فقدان الحواسيب.' },
    { icon: <ShieldCheck style={{ color: '#84cc16' }} size={26} />, title: 'الأمان والعديد من الأقسام', desc: 'صلاحيات مستخدمين دقيقة (مالك، مدير، كاشير، أمين مخزن) وفق نظام RBAC.' }
  ];

  // Why Madar Cards
  const whyMadarCards = [
    { icon: <Clock size={28} className="text-primary" />, title: 'تشغيل خلال دقائق', desc: 'لا تحتاج لتنصيب برامج معقدة. أنشئ حسابك وابدأ البيع فوراً من المتصفح.' },
    { icon: <Headphones size={28} style={{ color: '#10b981' }} />, title: 'دعم عربي 24/7', desc: 'فريق دعم متخصص يجيب على استفساراتك ويوجهك خطوة بخطوة باللغة العربية.' },
    { icon: <RefreshCw size={28} style={{ color: '#3b82f6' }} />, title: 'تحديثات مجانية دائمية', desc: 'نضيف مزايا جديدة بانتظام وتصلك التحديثات تلقائياً دون أي تكاليف إضافية.' },
    { icon: <Lock size={28} style={{ color: '#f59e0b' }} />, title: 'أمان عالي وتشفير SSL', desc: 'بياناتك المالية والمخزنية مشفرة ومحفوظة وفق أعلى معايير الأمان السحابي العالمية.' },
    { icon: <Cloud size={28} style={{ color: '#8b5cf6' }} />, title: 'نسخ احتياطي يومي', desc: 'تشفير وحفظ تلقائي يومي لقواعد البيانات دون خوف من تلف الأجهزة أو سرقتها.' },
    { icon: <Smartphone size={28} style={{ color: '#ec4899' }} />, title: 'يعمل من أي مكان', desc: 'تابع مبيعاتك وأرباح فروعك لحظة بلحظة من الكمبيوتر أو الموبايل أو التابلت.' }
  ];

  // Testimonials
  const testimonials = [
    { name: 'المهندس طارق العبد', company: 'سلسلة محلات النور للملابس', text: 'منصة مدار حولت إدارة فروعنا بالكامل إلى نظام سلس ومترابط. صرنا نتابع المبيعات والأرباح لحظة بلحظة من الموبايل!', rating: 5 },
    { name: 'أحمد أبو علي', company: 'سوبرماركت المدينة المنورة', text: 'سرعة الكاشير وطباعة الفواتير غيرت تجربة العملاء تماماً. الدعم الفني ممتاز وسريع جداً في الرد.', rating: 5 },
    { name: 'الحاج محمود عبده', company: 'معرض النور للسجاد والمنسوجات', text: 'سهولة إدارة حسابات الموردين والعملاء والقيود المالية وفرت علينا مجهود كبير جداً. ننصح بها بشدة!', rating: 5 }
  ];

  const faqs = [
    { q: 'هل يوجد عقد أو التزام طويل الأجل؟', a: 'لا، جميع اشتراكات مدار شهرية أو سنوية بدون أي عقود ملزمة. يمكنك إلغاء أو ترقية اشتراكك في أي وقت بسهولة.' },
    { q: 'هل يمكنني الإلغاء وتغيير الباقة في أي وقت؟', a: 'نعم، يمكنك الترقية أو التخفيض أو إلغاء الاشتراك بنقرة واحدة من لوحة التحكم دون أي رسوم خفية.' },
    { q: 'هل توجد فترة تجريبية مجانية؟', a: 'بالتأكيد! تمنحك منصة مدار تجربة مجانية كاملة المزايا لمدة 14 يوماً بدون الحاجة لإدخال بطاقة ائتمان.' },
    { q: 'هل يمكن نقل واستيراد بياناتي القديمة بسهولة؟', a: 'نعم، يدعم مدار استيراد ملفات Excel و CSV للأصناف والعملاء والموردين بضغطة زر واحدة في أقل من دقيقة.' },
    { q: 'هل توفرون تدريباً وتأهيلاً لفريق العمل؟', a: 'نعم، يقدم فريقنا جلسات تدريبية وفيديوهات شرح مفصلة باللغة العربية لمساعدة الكاشير والمحاسبين على إتقان النظام بسرعة.' },
    { q: 'هل الدعم الفني متوفر باللغة العربية؟', a: 'نعم، فريق الدعم متواجد 24/7 عبر الهاتف والواتساب والبريد الإلكتروني باللغة العربية.' }
  ];

  return (
    <div style={{ fontFamily: 'var(--font-ar)', direction: 'rtl', background: '#f8fafc', minHeight: '100vh', color: 'var(--text-main)', overflowX: 'hidden' }}>
      
      {/* Sticky Header Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 1000,
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div className="flex align-center gap-12">
          <div style={{
            width: '42px',
            height: '42px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>
            <ShoppingBag size={24} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-main)' }}>مِدار ERP Cloud</span>
        </div>

        <nav className="flex align-center gap-24" style={{ fontSize: '14.5px', fontWeight: '600' }}>
          <a href="#why-madar" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>لماذا مدار؟</a>
          <a href="#features" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>الموديولات</a>
          <a href="#pricing" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>الأسعار والباقات</a>
          <a href="#calculator" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>حاسبة التكلفة</a>
          <a href="#faq" style={{ color: 'var(--text-main)', textDecoration: 'none' }}>الأسئلة الشائعة</a>
        </nav>

        <div className="flex align-center gap-12">
          <Link to="/advisor" className="btn btn-secondary" style={{ padding: '9px 18px', fontSize: '13.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Bot size={16} className="text-primary" />
            <span>مستشار مدار الذكي</span>
          </Link>
          <Link to="/advisor" className="btn btn-primary" style={{ padding: '9px 22px', fontSize: '13.5px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Sparkles size={16} />
            <span>ابدأ تجربتك المجانية (14 يوم)</span>
          </Link>
        </div>
      </header>

      {/* SECTION 1 — Hero */}
      <section style={{
        padding: '80px 20px 60px 20px',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.15) 0%, rgba(124, 58, 237, 0.05) 50%, rgba(248, 250, 252, 1) 90%)',
        position: 'relative'
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          {/* Social Proof Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 22px',
            background: 'rgba(79, 70, 229, 0.08)',
            color: 'var(--primary)',
            borderRadius: '24px',
            fontSize: '13.5px',
            fontWeight: 'bold',
            marginBottom: '28px',
            border: '1px solid rgba(79, 70, 229, 0.2)'
          }}>
            <Flame size={18} style={{ color: 'var(--primary)' }} />
            <span>أكثر من 500 شركة ونشاط تجاري يثقون في منصة مدار Cloud</span>
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.25', color: '#0f172a', marginBottom: '24px' }}>
            مدار ERP Cloud <br />
            <span style={{ color: 'var(--primary)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              إدارة متكاملة لنشاطك التجاري من مكان واحد
            </span>
          </h1>

          <p style={{ fontSize: '19px', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '780px', margin: '0 auto 40px auto' }}>
            حل سحابي احترافي شامل لإدارة: نقاط البيع (POS) • المخزون • المحاسبة • المشتريات • العملاء • الموردين • التقارير • الفروع • الموظفين.
          </p>

          <div className="flex justify-center align-center gap-16 mb-40">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/advisor" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '17px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)' }}>
                <span>ابدأ تجربتك المجانية (14 يوم مجاناً)</span>
                <ArrowLeft size={20} />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/advisor" className="btn btn-secondary" style={{ padding: '16px 32px', fontSize: '17px', borderRadius: '12px', background: '#fff' }}>
                تحدث مع مستشار مدار
              </Link>
            </motion.div>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '50px' }}>
            بدون بطاقة ائتمان • إعداد فوري في دقيقة • دعم عربي كامل
          </div>

          {/* Interactive Laptop + Mobile Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              position: 'relative',
              maxWidth: '960px',
              margin: '0 auto',
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(79, 70, 229, 0.08)',
              padding: '24px',
              textAlign: 'right'
            }}
          >
            <div className="flex justify-between align-center mb-16" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div className="flex align-center gap-8">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '12px', fontWeight: 'bold' }}>madar.app/dashboard</span>
              </div>
              <span className="badge success">مباشر ومحدث الآن</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--primary)' }}>إحصائيات اليوم</div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>إجمالي مبيعات اليوم</div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--success)' }}>14,850 ج.م</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>عدد الفواتير الصادرة</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>42 فاتورة</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>حالة المخزون</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>98% رصيد آمن</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>مؤشر المبيعات والأرباح الأسبوعية</div>
                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '12px', justifyContent: 'space-around', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
                  <div style={{ height: '40%', width: '12%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '65%', width: '12%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '50%', width: '12%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '85%', width: '12%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                  <div style={{ height: '100%', width: '12%', background: 'var(--secondary)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2 — Trusted Numbers (Animated Counters) */}
      <section style={{ padding: '50px 20px', background: '#ffffff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px' }}>+{companiesCount}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'bold' }}>شركة ومحل تجاري</div>
          </div>
          <div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px' }}>+{invoicesCount.toLocaleString()}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'bold' }}>فاتورة بيع شهرياً</div>
          </div>
          <div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--primary)', marginBottom: '4px' }}>+{transactionsCount.toLocaleString()}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'bold' }}>عملية مخزنية ومالية</div>
          </div>
          <div>
            <div style={{ fontSize: '38px', fontWeight: '900', color: 'var(--success)', marginBottom: '4px' }}>+{branchesCount.toLocaleString()}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'bold' }}>فرع متصل بالسحابة</div>
          </div>
        </div>
      </section>

      {/* Customer Logos Gallery */}
      <section style={{ padding: '40px 20px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '20px' }}>
            تثق بنا أبرز الماركات وسلاسل التجزئة والمتاجر
          </span>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
            {['سلسلة النور', 'مودابيلا للملابس', 'مجموعة المدينة', 'أسواق الخير', 'سوبرماركت البركة', 'الشركة العربية'].map((logo, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.1, filter: 'grayscale(0%)' }}
                style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: 'var(--text-muted)',
                  filter: 'grayscale(100%)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Building size={16} />
                <span>{logo}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Madar? (لماذا مدار؟) */}
      <section id="why-madar" style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '14px' }}>لماذا يختار التجار والشركات منصة مدار Cloud؟</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>تصميم وتكنولوجيا سحابية فائقة تميز عملك وتضمن استقرار تجارتك</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {whyMadarCards.map((c, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className="card"
              style={{ padding: '28px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '16px' }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                {c.icon}
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 'bold', marginBottom: '10px' }}>{c.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Features Grid */}
      <section id="features" style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '14px' }}>موديولات متكاملة لتغطية كافة جوانب تجارتك</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>منصة واحدة تغنيك عن برامج متعددة غير متوافقة</p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}
          >
            {modulesList.map((m, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                whileHover={{ y: -6 }}
                className="card" 
                style={{ padding: '28px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '16px' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  {m.icon}
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: 'bold', marginBottom: '10px' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Redesigned Smart SaaS Pricing UI */}
      <section id="pricing" style={{ padding: '80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontSize: '34px', fontWeight: '900', marginBottom: '14px' }}>خطط الأسعار والباقات السحابية</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '28px' }}>اختر الباقة المناسبة لنشاطك التجاري مع تجربة مجانية لمدة 14 يوماً</p>

            {/* Monthly / Yearly Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', border: '1px solid var(--border)', borderRadius: '30px', padding: '6px', gap: '8px' }}>
              <button
                className={`btn ${!isYearly ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '24px', padding: '8px 24px', fontSize: '13.5px', border: 'none' }}
                onClick={() => setIsYearly(false)}
              >
                دفع شهري
              </button>
              <button
                className={`btn ${isYearly ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '24px', padding: '8px 24px', fontSize: '13.5px', border: 'none', display: 'flex', gap: '6px', alignItems: 'center' }}
                onClick={() => setIsYearly(true)}
              >
                <span>دفع سنوي</span>
                <span style={{ background: '#10b981', color: '#fff', fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>خصم شهرين مجاناً</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
            {/* Starter */}
            <div className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>المبتدئة (Starter)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>للمحلات والأنشطة الصغيرة الناشئة</p>
                <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)', marginBottom: '20px' }}>
                  {isYearly ? '4,990' : '499'} EGP <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/{isYearly ? 'سنوياً' : 'شهرياً'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>فرع واحد (1 Branch)</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>حتى 3 مستخدمين (3 Users)</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>شاشة كاشير POS كاملة</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>مبيعات وعملاء وموردين</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>إدارة المخزون والتقارير الأساسية</span></li>
                  <li className="flex align-center gap-8" style={{ opacity: 0.4 }}><XCircle size={18} className="text-danger" /> <span>المحاسبة المزدوجة</span></li>
                  <li className="flex align-center gap-8" style={{ opacity: 0.4 }}><XCircle size={18} className="text-danger" /> <span>مساعد الذكاء الاصطناعي</span></li>
                </ul>
              </div>
              <Link to="/advisor" className="btn btn-secondary" style={{ width: '100%', padding: '12px', textAlign: 'center' }}>ابدأ الان مجاناً</Link>
            </div>

            {/* Business (Most Popular) */}
            <motion.div whileHover={{ y: -6 }} className="card" style={{ padding: '32px', border: '2px solid var(--primary)', background: '#ffffff', borderRadius: '20px', position: 'relative', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ position: 'absolute', top: '-14px', right: '50%', transform: 'translateX(50%)', background: 'var(--primary)', color: '#fff', fontSize: '12px', padding: '4px 18px', borderRadius: '14px', fontWeight: 'bold' }}>الأكثر مبيعاً Most Popular</span>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>الأعمال (Business)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>للمحلات التجارية المتوسطة المتوسعة</p>
                <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)', marginBottom: '20px' }}>
                  {isYearly ? '9,990' : '999'} EGP <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/{isYearly ? 'سنوياً' : 'شهرياً'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>حتى 5 فروع (5 Branches)</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>حتى 20 مستخدم (20 Users)</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>محاسبة مالية وقيود مزدوجة</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>المشتريات والمصروفات والخزينة</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>دليل الحسابات والتنبيهات</span></li>
                  <li className="flex align-center gap-8" style={{ opacity: 0.4 }}><XCircle size={18} className="text-danger" /> <span>مساعد الذكاء الاصطناعي</span></li>
                </ul>
              </div>
              <Link to="/advisor" className="btn btn-primary" style={{ width: '100%', padding: '12px', textAlign: 'center' }}>ابدأ الان مجاناً</Link>
            </motion.div>

            {/* Professional */}
            <div className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>الاحترافية (Professional)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>للشركات الكبرى وسلاسل الفروع</p>
                <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)', marginBottom: '20px' }}>
                  {isYearly ? '19,990' : '1,999'} EGP <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/{isYearly ? 'سنوياً' : 'شهرياً'}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>فروع غير محدودة (Unlimited Branches)</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>مستخدمين غير محدودين</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>مساعد الذكاء الاصطناعي AI</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>ربط الـ API والـ White Label</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>تحليلات تنفيذية ودعم أولوية</span></li>
                </ul>
              </div>
              <Link to="/advisor" className="btn btn-secondary" style={{ width: '100%', padding: '12px', textAlign: 'center' }}>ابدأ الان مجاناً</Link>
            </div>

            {/* Enterprise */}
            <div className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>المؤسسات (Enterprise)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>حلول مخصصة وسيرفرات مستقلة</p>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', marginBottom: '20px' }}>تواصل معنا</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', textAlign: 'right', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>كل شيء غير محدود 100%</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>خادم خاص ومساحة سحابية مستقلة</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>ربط وتخصيص الدومين الخاص</span></li>
                  <li className="flex align-center gap-8"><Check size={18} className="text-success" /> <span>مدير حساب مخصص وتدريب ميداني</span></li>
                </ul>
              </div>
              <a href="#contact" className="btn btn-secondary" style={{ width: '100%', padding: '12px', textAlign: 'center' }}>طلب سعر خاص</a>
            </div>
          </div>

          {/* Smart Pricing Calculator Component */}
          <div id="calculator">
            <PricingCalculator />
          </div>

          {/* Detailed Feature Comparison Table */}
          <div style={{ marginTop: '60px' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '8px' }}>جدول المقارنة التفصيلي بين الباقات</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14.5px' }}>قارن الخصائص والموديولات المضمنة في كل باقة بالتفصيل</p>
            </div>

            <div className="table-container card">
              <table>
                <thead>
                  <tr>
                    <th>الوحدة / الميزة</th>
                    <th style={{ textAlign: 'center' }}>المبتدئة (Starter)</th>
                    <th style={{ textAlign: 'center', color: 'var(--primary)' }}>الأعمال (Business)</th>
                    <th style={{ textAlign: 'center' }}>الاحترافية (Pro)</th>
                    <th style={{ textAlign: 'center' }}>المؤسسات (Enterprise)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>شاشة كاشير POS بالبارشود</td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>إدارة المخزون والتنبيهات</td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>المحاسبة المزدوجة والشجرة</td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>الخزينة والبنوك والقيود</td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>مساعد الذكاء الاصطناعي AI</td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>وصول الـ API والـ White Label</td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><XCircle size={20} className="text-danger" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                    <td style={{ textAlign: 'center' }}><CheckCircle2 size={20} className="text-success" style={{ margin: '0 auto' }} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel / Grid */}
      <section style={{ padding: '80px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '14px' }}>آراء عملائنا وشركاء النجاح</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>ثقة مئات المحلات والأنشطة التجارية في مصر والعالم العربي</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {testimonials.map((t, idx) => (
            <motion.div key={idx} whileHover={{ y: -6 }} className="card" style={{ padding: '28px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '16px' }}>
              <div className="flex justify-between align-center mb-16">
                <div className="flex gap-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={18} style={{ fill: '#f59e0b', color: '#f59e0b' }} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: '14.5px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>
                "{t.text}"
              </p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{t.name}</div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{t.company}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Below Pricing */}
      <section id="faq" style={{ padding: '80px 20px', background: '#ffffff', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '14px' }}>الأسئلة الشائعة حول الباقات والاشتراكات</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>إجابات واضحة لجميع استفساراتك قبل البدء</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((faq, idx) => (
              <div key={idx} className="card" style={{ padding: '20px 24px', cursor: 'pointer', borderRadius: '12px' }} onClick={() => toggleFaq(idx)}>
                <div className="flex justify-between align-center">
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <HelpCircle size={20} className="text-primary" />
                    <span>{faq.q}</span>
                  </h4>
                  <ChevronDown size={20} style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
                {openFaq === idx && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.7', borderTop: '1px solid var(--border)', paddingTop: '12px', margin: '14px 0 0 0' }}
                  >
                    {faq.a}
                  </motion.p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10 — Contact */}
      <section id="contact" style={{ padding: '80px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '14px' }}>تواصل مع فريق الدعم الفني والمبيعات</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>فريقنا متواجد على مدار الساعة لمساعدتك واستقبال استفساراتك</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>معلومات الاتصال المباشر</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14.5px' }}>
              <div className="flex align-center gap-12">
                <Phone size={20} className="text-primary" />
                <span>الهاتف المباشر: 01143632650</span>
              </div>
              <div className="flex align-center gap-12">
                <Mail size={20} className="text-primary" />
                <span>البريد الإلكتروني: support@madar.app</span>
              </div>
              <div className="flex align-center gap-12">
                <MapPin size={20} className="text-primary" />
                <span>العنوان: القاهرة - المهندسين - مصر</span>
              </div>
              <div className="flex align-center gap-12">
                <Globe size={20} className="text-primary" />
                <span>الموقع الرسمي: www.madar.app</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            {contactSuccess && (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '8px', marginBottom: '20px', fontSize: '13.5px' }}>
                تم إرسال رسالتك بنجاح! سيتواصل معك أحد ممثلي المبيعات في أقرب وقت.
              </div>
            )}

            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'right' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>الاسم بالكامل *</label>
                <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>البريد الإلكتروني *</label>
                <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>رقم الهاتف</label>
                <input type="text" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} placeholder="01012345678" />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>نص الاستفسار *</label>
                <textarea rows={4} value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'var(--font-ar)' }}></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '15px' }}>إرسال الرسالة</button>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION 11 — Final CTA */}
      <section style={{
        padding: '90px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        color: '#ffffff'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '900', marginBottom: '18px', color: '#ffffff' }}>
            ابدأ إدارة مشروعك باحتراف مع منصة مدار
          </h2>
          <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: '1.6', marginBottom: '36px' }}>
            انضم إلى مئات الشركات والأنشطة التجارية واجعل إدارة عملك أسهل وأسرع من اليوم!
          </p>

          <Link to="/advisor" className="btn" style={{ padding: '16px 40px', fontSize: '18px', borderRadius: '12px', background: '#ffffff', color: 'var(--primary)', fontWeight: 'bold', display: 'inline-flex', gap: '10px', alignItems: 'center', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}>
            <Bot size={22} />
            <span>ابدأ تجربتك المجانية (14 يوم مجاناً)</span>
          </Link>
        </div>
      </section>

      {/* SECTION 12 — Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '60px 20px 40px 20px', fontSize: '13.5px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', textAlign: 'right', marginBottom: '40px' }}>
          <div>
            <div className="flex align-center gap-10 mb-16">
              <ShoppingBag size={24} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>مِدار ERP Cloud</span>
            </div>
            <p style={{ lineHeight: '1.6', color: '#64748b' }}>منصة سحابية متكاملة لإدارة الأنشطة التجارية والمحلات ونقاط البيع بأحدث التكنولوجيات السحابية.</p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>روابط سريعة</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#why-madar" style={{ color: '#94a3b8', textDecoration: 'none' }}>لماذا منصة مدار؟</a></li>
              <li><a href="#features" style={{ color: '#94a3b8', textDecoration: 'none' }}>المزايا والموديولات</a></li>
              <li><a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>الباقات والأسعار</a></li>
              <li><a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>الأسئلة الشائعة</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>الشروط والخصوصية</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>سياسة الخصوصية</a></li>
              <li><a href="#faq" style={{ color: '#94a3b8', textDecoration: 'none' }}>شروط الاستخدام</a></li>
              <li><a href="#contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>تواصل معنا</a></li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          جميع الحقوق محفوظة © 2026 منصة مدار ERP Cloud السحابية.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
