import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Check, ArrowLeft, Sparkles, Building2, Users, Boxes, Bot, ShieldCheck, Zap } from 'lucide-react';

const PricingCalculator = () => {
  const navigate = useNavigate();

  const [branchesCount, setBranchesCount] = useState(1);
  const [usersCount, setUsersCount] = useState(2);
  const [warehousesCount, setWarehousesCount] = useState(1);
  
  const [needPos, setNeedPos] = useState(true);
  const [needAccounting, setNeedAccounting] = useState(false);
  const [needAi, setNeedAi] = useState(false);
  const [needWhiteLabel, setNeedWhiteLabel] = useState(false);
  const [needApi, setNeedApi] = useState(false);
  const [needReps, setNeedReps] = useState(false);

  // Dynamic Rule-Based Plan Calculation
  const calculateResult = () => {
    let recommended = {
      planKey: 'BUSINESS',
      name: 'باقة الأعمال (Business)',
      priceMonthly: 999,
      priceYearly: 9990,
      badge: 'الأكثر ملاءمة لنشاطك',
      reason: `بناءً على طلبك لعدد ${branchesCount} فروع و ${usersCount} مستخدمين.`
    };

    if (branchesCount > 10 || usersCount > 20 || needWhiteLabel || warehousesCount > 5) {
      recommended = {
        planKey: 'PROFESSIONAL',
        name: 'الباقة الاحترافية (Professional)',
        priceMonthly: 1999,
        priceYearly: 19990,
        badge: 'أقصى أداء وتوسع',
        reason: 'تتطلب إمكانيات غير محدودة للفروع والمستخدمين مع وصول الـ API ومساعد الذكاء الاصطناعي.'
      };
    } else if (branchesCount > 5 || usersCount > 20 || needAi || needApi) {
      recommended = {
        planKey: 'PROFESSIONAL',
        name: 'الباقة الاحترافية (Professional)',
        priceMonthly: 1999,
        priceYearly: 19990,
        badge: 'أقصى أداء وتوسع',
        reason: 'تحتاج إلى مساعد الذكاء الاصطناعي والوصول المباشر للـ API.'
      };
    } else if (branchesCount === 1 && usersCount <= 3 && !needAccounting && !needAi && !needReps) {
      recommended = {
        planKey: 'STARTER',
        name: 'الباقة المبتدئة (Starter)',
        priceMonthly: 499,
        priceYearly: 4990,
        badge: 'الأوفر للمشروع الناشئ',
        reason: 'تناسب فرع واحد و 3 مستخدمين مع نقاط البيع والمخزون الأساسي.'
      };
    }

    return recommended;
  };

  const result = calculateResult();

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid var(--border)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
      padding: '36px',
      margin: '40px 0',
      direction: 'rtl',
      fontFamily: 'var(--font-ar)'
    }}>
      <div className="flex align-center gap-12 mb-24">
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'rgba(79, 70, 229, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Calculator size={26} />
        </div>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>حاسبة التكلفة والباقة الذكية</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '4px 0 0 0' }}>حدد احتياجات مؤسستك وسيقوم النظام باحتساب الباقة والتقدير المالي الدقيق فوراً</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '36px', alignItems: 'start' }}>
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sliders */}
          <div style={{ background: 'var(--bg-app)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="flex justify-between align-center mb-8">
              <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Building2 size={18} className="text-primary" />
                <span>عدد الفروع المطلوبة:</span>
              </label>
              <span className="badge primary" style={{ fontSize: '14px', fontWeight: 'bold' }}>{branchesCount} فرع</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={branchesCount}
              onChange={(e) => setBranchesCount(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <div style={{ background: 'var(--bg-app)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div className="flex justify-between align-center mb-8">
              <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Users size={18} className="text-primary" />
                <span>عدد المستخدمين والكاشيرات:</span>
              </label>
              <span className="badge primary" style={{ fontSize: '14px', fontWeight: 'bold' }}>{usersCount} مستخدمين</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={usersCount}
              onChange={(e) => setUsersCount(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Additional Features Checkboxes */}
          <div>
            <label style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', display: 'block' }}>الموديلات والخصائص الإضافية:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label className="flex align-center gap-8" style={{ fontSize: '13px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={needPos} onChange={(e) => setNeedPos(e.target.checked)} />
                <span>شاشة كاشير POS</span>
              </label>

              <label className="flex align-center gap-8" style={{ fontSize: '13px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={needAccounting} onChange={(e) => setNeedAccounting(e.target.checked)} />
                <span>محاسبة وقيود مالية</span>
              </label>

              <label className="flex align-center gap-8" style={{ fontSize: '13px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={needAi} onChange={(e) => setNeedAi(e.target.checked)} />
                <span>مساعد ذكاء اصطناعي</span>
              </label>

              <label className="flex align-center gap-8" style={{ fontSize: '13px', cursor: 'pointer', background: 'var(--bg-app)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <input type="checkbox" checked={needWhiteLabel} onChange={(e) => setNeedWhiteLabel(e.target.checked)} />
                <span>علامة تجارية خاصة (White Label)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Dynamic Recommendation Output Box */}
        <motion.div
          key={result.planKey}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(124, 58, 237, 0.02) 100%)',
            border: '2px solid var(--primary)',
            borderRadius: '16px',
            padding: '28px',
            textAlign: 'center'
          }}
        >
          <span className="badge primary mb-12" style={{ fontSize: '12.5px', padding: '6px 14px' }}>{result.badge}</span>
          <h4 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{result.name}</h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>{result.reason}</p>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: 'var(--primary)' }}>
              {result.priceMonthly.toLocaleString()} EGP <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ شهرياً</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 'bold', marginTop: '4px' }}>
              أو {result.priceYearly.toLocaleString()} EGP سنوياً (خصم شهرين مجاناً)
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/advisor')}
          >
            <Sparkles size={18} />
            <span>ابدأ التجربة المجانية لهذه الباقة</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingCalculator;
