import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Eye, 
  TrendingUp, 
  AlertTriangle,
  AlertCircle,
  Store,
  DollarSign,
  Lock,
  Mail,
  Shield,
  Layers,
  FileText,
  Database,
  LogOut,
  Download,
  Settings as SettingsIcon,
  EyeOff,
  UserCheck,
  Edit2,
  Plus,
  X
} from 'lucide-react';

const AdminPanel = ({ user, onLogout }) => {
  // Tab control state
  const [activeTab, setActiveTab] = useState('dashboard');

  // Selected tenant for feature editing
  const [editingTenant, setEditingTenant] = useState(null);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  // Pricing Plans Configurations (loaded from localStorage or defaults)
  const [plansConfig, setPlansConfig] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_plans_config')) || [
      { id: 'starter', name: 'الباقة المبتدئة (Starter)', price: 99, maxUsers: 2, maxBranches: 1, maxProducts: 500, support: 'دعم فني عادي' },
      { id: 'business', name: 'باقة الأعمال (Business)', price: 199, maxUsers: 5, maxBranches: 3, maxProducts: 2000, support: 'دعم فني سريع' },
      { id: 'pro', name: 'الباقة الاحترافية (Professional)', price: 349, maxUsers: 15, maxBranches: 10, maxProducts: 99999, support: 'دعم فني متواصل 24/7' },
      { id: 'lifetime', name: 'العميل الدائم (Lifetime)', price: 4999, maxUsers: 999, maxBranches: 999, maxProducts: 99999, support: 'دعم VIP مباشر وسرعة استجابة فائقة' }
    ];
  });

  // Feature controls states (loaded from localStorage or defaults)
  const [selectedTenantFeatures, setSelectedTenantFeatures] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_features')) || {
      pos: true,
      inventory: true,
      suppliers: true,
      customers: true,
      reports: true,
      users: true,
      branches: true,
      expenses: true,
      clothingSpecs: true,
      carpetSpecs: true,
      supermarketSpecs: true
    };
  });

  // Mock data for registered shops (tenants)
  const [tenants, setTenants] = useState([
    { id: 't1', name: 'بوتيك مودابيلا للملابس', owner: 'طه أنس', phone: '01143632650', plan: 'business', status: 'active', expiresAt: '2026-08-12', invoicesCount: 1, totalSales: 800 },
    { id: 't2', name: 'سوبرماركت المدينة المنورة', owner: 'أحمد أبو علي', phone: '01022334455', plan: 'starter', status: 'trial', expiresAt: '2026-07-26', invoicesCount: 0, totalSales: 0 },
    { id: 't3', name: 'معرض النور للسجاد الفاخر', owner: 'الحاج محمود عبده', phone: '01511223344', plan: 'pro', status: 'active', expiresAt: '2026-10-15', invoicesCount: 3, totalSales: 18500 }
  ]);

  // Mock data for InstaPay activation requests
  const [activationRequests, setActivationRequests] = useState([
    {
      id: 'req1',
      tenantName: 'أحذية كوتشي ترند',
      ownerName: 'محمد طاهر',
      phone: '01222334455',
      planRequested: 'starter',
      price: 99,
      transactionId: 'TXN778901234',
      date: '2026-07-12 02:10',
      status: 'pending'
    }
  ]);

  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Broadcast and Grace Requests States
  const [broadcastText, setBroadcastText] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_broadcast'))?.text || '';
  });
  const [broadcastType, setBroadcastType] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_broadcast'))?.type || 'info';
  });
  const [broadcastTarget, setBroadcastTarget] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_broadcast'))?.target || 'all';
  });

  // Create New Tenant (Shop) Modal
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [createTenantForm, setCreateTenantForm] = useState({
    name: '',
    owner: '',
    phone: '',
    email: '',
    plan: 'starter',
    features: { pos: true, inventory: true, suppliers: true, customers: true, reports: true, users: true, branches: false, expenses: true, clothingSpecs: false, carpetSpecs: false, supermarketSpecs: false },
    password: ''
  });

  const [graceRequests, setGraceRequests] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_grace_requests')) || [
      { id: 'g1', tenantName: 'سوبرماركت المدينة المنورة', owner: 'أحمد أبو علي', date: '2026-07-12 03:30', status: 'pending' }
    ];
  });

  // Calculate security/abuse alerts dynamically based on tenants stats
  const securityAlerts = (() => {
    const alerts = [];
    tenants.forEach(t => {
      // If a tenant on starter plan exceeds limits
      if (t.plan === 'starter' && t.invoicesCount >= 0) { // simulate alert for demo
        alerts.push({
          id: `alert-limit-${t.id}`,
          level: 'warning',
          title: `اشتباه تجاوز حدود الباقة للمتجر (${t.name})`,
          text: `المحل مسجل في الباقة المبتدئة ولكنه يقترب من حد الاستخدام الأقصى. يرجى التوصية بالترقية لباقة الأعمال لضمان استمرار الخدمة.`,
          date: 'اليوم، 01:12 ص'
        });
      }
      // Suspended accounts
      if (t.status === 'suspended') {
        alerts.push({
          id: `alert-suspended-${t.id}`,
          level: 'danger',
          title: `محاولات اتصال لحساب متجر معلق: (${t.name})`,
          text: `تم رصد 4 محاولات تسجيل دخول كاشير فاشلة من عنوان IP غير مسجل بالمنظومة لحساب معلق. تم حظر محاولات الاتصال تلقائياً.`,
          date: 'منذ ساعتين'
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        id: 'default-alert-1',
        level: 'success',
        title: 'جميع الفروع والنشاطات آمنة ✅',
        text: 'لا توجد محاولات تلاعب بالباقات أو استخدام مشبوه أو استغلال ثغرات حالياً.',
        date: 'تحديث فوري'
      });
    }
    return alerts;
  })();

  const handleApprove = (reqId, tenantName, planRequested) => {
    setActivationRequests(activationRequests.filter(r => r.id !== reqId));
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const expiresStr = nextMonth.toISOString().split('T')[0];

    const existing = tenants.find(t => t.name === tenantName);
    if (existing) {
      setTenants(tenants.map(t => t.name === tenantName ? { ...t, status: 'active', plan: planRequested, expiresAt: expiresStr } : t));
    } else {
      setTenants([
        ...tenants,
        {
          id: 't' + (tenants.length + 1),
          name: tenantName,
          owner: 'محمد طاهر',
          phone: '01222334455',
          plan: planRequested,
          status: 'active',
          expiresAt: expiresStr,
          invoicesCount: 0,
          totalSales: 0
        }
      ]);
    }
    alert(`تم تفعيل حساب متجر (${tenantName}) بنجاح وتمديد الاشتراك لمدة 30 يوماً! 🎉`);
  };

  const handleReject = (reqId, tenantName) => {
    if (window.confirm(`هل أنت متأكد من رفض طلب تفعيل متجر (${tenantName})؟`)) {
      setActivationRequests(activationRequests.filter(r => r.id !== reqId));
      alert(`تم رفض الطلب وإلغاء التفعيل.`);
    }
  };

  const handleSuspend = (tenantId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = currentStatus === 'suspended' 
      ? 'هل تريد إعادة تفعيل هذا المحل؟' 
      : 'هل أنت متأكد من تعليق/إيقاف هذا الحساب؟ لن يتمكن الموظفون من استخدام الكاشير.';
      
    if (window.confirm(confirmMsg)) {
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: nextStatus } : t));
    }
  };

  const saveFeatures = () => {
    localStorage.setItem('mizan_features', JSON.stringify(selectedTenantFeatures));
    setShowFeaturesModal(false);
    alert('تم حفظ إعدادات وتخصيص الميزات للمتجر بنجاح!');
  };

  const handlePublishBroadcast = (e) => {
    e.preventDefault();
    localStorage.setItem('mizan_broadcast', JSON.stringify({ text: broadcastText, type: broadcastType, target: broadcastTarget }));
    alert('تم بث الإعلان العام للمجموعات المستهدفة بنجاح! 📡');
  };

  const handleClearBroadcast = () => {
    localStorage.removeItem('mizan_broadcast');
    setBroadcastText('');
    alert('تم إيقاف وحذف البث الإعلاني الفعال.');
  };

  const handleApproveGrace = (reqId, tenantName) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const expiresStr = nextDate.toISOString().split('T')[0];

    // Find the tenant and set status to active and expiresAt to expiresStr
    setTenants(tenants.map(t => t.name === tenantName ? { ...t, expiresAt: expiresStr, status: 'active' } : t));
    const updatedReqs = graceRequests.filter(r => r.id !== reqId);
    setGraceRequests(updatedReqs);
    localStorage.setItem('mizan_grace_requests', JSON.stringify(updatedReqs));
    alert(`تمت الموافقة على مهلة سماح لمتجر (${tenantName}) وتمديد الخدمة لمدة 3 أيام! ✅`);
  };

  const handleRejectGrace = (reqId) => {
    const updatedReqs = graceRequests.filter(r => r.id !== reqId);
    setGraceRequests(updatedReqs);
    localStorage.setItem('mizan_grace_requests', JSON.stringify(updatedReqs));
    alert('تم رفض طلب مهلة السماح.');
  };

  // Create Tenant handler
  const handleCreateTenant = (e) => {
    e.preventDefault();
    if (!createTenantForm.name || !createTenantForm.owner || !createTenantForm.phone) {
      alert('يرجى ملء الحقول الإلزامية!');
      return;
    }
    const plan = plansConfig.find(p => p.id === createTenantForm.plan);
    const today = new Date();
    const months = createTenantForm.plan === 'lifetime' ? 1200 : 1;
    today.setMonth(today.getMonth() + months);
    const expiresAt = today.toISOString().split('T')[0];
    const newTenant = {
      id: 't' + (tenants.length + 1),
      name: createTenantForm.name,
      owner: createTenantForm.owner,
      phone: createTenantForm.phone,
      email: createTenantForm.email,
      plan: createTenantForm.plan,
      status: 'active',
      expiresAt,
      invoicesCount: 0,
      totalSales: 0,
      features: createTenantForm.features
    };
    setTenants([...tenants, newTenant]);
    setShowCreateTenant(false);
    setCreateTenantForm({
      name: '', owner: '', phone: '', email: '', plan: 'starter',
      features: { pos: true, inventory: true, suppliers: true, customers: true, reports: true, users: true, branches: false, expenses: true, clothingSpecs: false, carpetSpecs: false, supermarketSpecs: false },
      password: ''
    });
    alert(`تم إنشاء حساب متجر «${newTenant.name}» بنجاح! باقة: ${plan?.name}. ينتهي تاريخ: ${expiresAt} ✅`);
  };

  // Direct Impersonation (Login as Shop Owner)
  const handleImpersonate = (tenant) => {
    const shopUser = { 
      role: 'shop', 
      email: 'shop@mizan.com', 
      name: `${tenant.owner} (${tenant.name})`,
      tenantName: tenant.name,
      plan: tenant.plan,
      impersonated: true
    };
    localStorage.setItem('mizan_user', JSON.stringify(shopUser));
    alert(`جاري التحويل لمتجر (${tenant.name}) لمعاينته وتجربته...`);
    window.location.href = '/'; // Reloads router and logs in
  };

  const updatePlanConfig = (planId, key, value) => {
    const updatedPlans = plansConfig.map(p => {
      if (p.id === planId) {
        return { ...p, [key]: value };
      }
      return p;
    });
    setPlansConfig(updatedPlans);
    localStorage.setItem('mizan_plans_config', JSON.stringify(updatedPlans));
  };

  const getPlanLabel = (plan) => {
    const found = plansConfig.find(p => p.id === plan);
    return found ? `${found.name} (${found.price} ج.م)` : plan;
  };

  const downloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      tenants: tenants,
      features: selectedTenantFeatures,
      plansConfig: plansConfig,
      systemVersion: '2.2.0'
    };
    const fileData = JSON.stringify(backupData, null, 2);
    const blob = new Blob([fileData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mizan_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f8fafc, #eff6ff)',
      fontFamily: 'var(--font-ar)',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Super Admin Topbar */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
            color: '#fff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '22px',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}>M</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>لوحة الإدارة المركزية (Super Admin)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>مرحبًا بك يا طه، أنت الآن تتحكم في نظام ميزان بالكامل.</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            padding: '6px 14px', 
            fontSize: '13px', 
            background: 'rgba(79, 70, 229, 0.1)', 
            color: 'var(--primary)', 
            borderRadius: '20px', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Shield size={16} />
            المشرف الرئيسي
          </span>
          <button 
            onClick={onLogout} 
            className="btn btn-danger" 
            style={{ 
              padding: '8px 20px', 
              fontSize: '13px', 
              display: 'flex', 
              gap: '8px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
            }}
          >
            <LogOut size={16} />
            <span>خروج آمن</span>
          </button>
        </div>
      </header>

      {/* Admin Body Container */}
      <div style={{ display: 'flex', flex: 1, padding: '24px 32px', gap: '24px' }}>
        
        {/* Admin Navigation Sidebar */}
        <aside style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'dashboard' ? 'var(--primary)' : '#fff',
              color: activeTab === 'dashboard' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'dashboard' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <TrendingUp size={18} />
            <span>لوحة التحكم والإحصاءات</span>
          </button>

          <button 
            onClick={() => setActiveTab('tenants')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'tenants' ? 'var(--primary)' : '#fff',
              color: activeTab === 'tenants' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'tenants' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <Store size={18} />
            <span>إدارة المحلات والميزات</span>
          </button>

          <button 
            onClick={() => setActiveTab('plans')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'plans' ? 'var(--primary)' : '#fff',
              color: activeTab === 'plans' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'plans' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={18} />
            <span>إدارة باقات التسعير والحدود</span>
          </button>

          <button 
            onClick={() => setActiveTab('approvals')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'approvals' ? 'var(--primary)' : '#fff',
              color: activeTab === 'approvals' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'approvals' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              position: 'relative',
              transition: 'all 0.2s'
            }}
          >
            <CreditCard size={18} />
            <span>طلبات تفعيل الاشتراكات</span>
            {activationRequests.length > 0 && (
              <span style={{
                position: 'absolute',
                left: '12px',
                background: 'var(--danger)',
                color: '#fff',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px'
              }}>{activationRequests.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('system')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'system' ? 'var(--primary)' : '#fff',
              color: activeTab === 'system' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'system' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <Database size={18} />
            <span>النظام والنسخ الاحتياطي</span>
          </button>

          <button 
            onClick={() => setActiveTab('db_monitor')}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'db_monitor' ? 'var(--primary)' : '#fff',
              color: activeTab === 'db_monitor' ? '#fff' : 'var(--text-main)',
              textAlign: 'right',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: activeTab === 'db_monitor' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <Database size={18} />
            <span>مراقب قواعد البيانات (DB Monitor)</span>
          </button>
        </aside>

        {/* Admin Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid-cols-4" style={{ marginBottom: 0 }}>
                <div className="card stat-card">
                  <div className="stat-info">
                    <span className="stat-title">إجمالي المحلات المشتركة</span>
                    <span className="stat-value">{tenants.length} محلات</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>متاجر نشطة وتجريبية</span>
                  </div>
                  <div className="stat-icon primary"><Store size={24} /></div>
                </div>

                <div className="card stat-card">
                  <div className="stat-info">
                    <span className="stat-title">إجمالي الدخل الشهري المتوقع</span>
                    <span className="stat-value" style={{ color: 'var(--success)' }}>
                      {tenants.reduce((acc, t) => {
                        const planObj = plansConfig.find(p => p.id === t.plan);
                        return acc + (planObj ? planObj.price : 0);
                      }, 0)} ج.م
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>مجموع الاشتراكات النشطة</span>
                  </div>
                  <div className="stat-icon success"><DollarSign size={24} /></div>
                </div>

                <div className="card stat-card">
                  <div className="stat-info">
                    <span className="stat-title">طلبات اشتراك جديدة</span>
                    <span className="stat-value" style={{ color: activationRequests.length > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
                      {activationRequests.length} طلبات
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>بانتظار التحقق من التحويل</span>
                  </div>
                  <div className="stat-icon warning"><CreditCard size={24} /></div>
                </div>

                <div className="card stat-card">
                  <div className="stat-info">
                    <span className="stat-title">نسبة تجديد الاشتراكات</span>
                    <span className="stat-value" style={{ color: 'var(--secondary)' }}>94%</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>معدل الاحتفاظ بالعملاء</span>
                  </div>
                  <div className="stat-icon primary"><TrendingUp size={24} /></div>
                </div>
              </div>

              {/* Early Warning and Abuse Alerts Section */}
              <div className="card" style={{ borderRight: '4px solid var(--danger)' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                  <AlertCircle size={20} />
                  <span>لوحة الإنذار المبكر والأمان (تنبيهات الاستخدام المشبوه)</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {securityAlerts.map((alert) => (
                    <div key={alert.id} style={{
                      padding: '12px 16px',
                      background: alert.level === 'danger' ? 'rgba(239, 68, 68, 0.05)' : alert.level === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                      border: `1px solid ${alert.level === 'danger' ? 'rgba(239, 68, 68, 0.2)' : alert.level === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13.5px'
                    }}>
                      <div>
                        <strong style={{ display: 'block', color: alert.level === 'danger' ? 'var(--danger)' : alert.level === 'warning' ? 'var(--warning)' : 'var(--success)', marginBottom: '4px' }}>
                          {alert.title}
                        </strong>
                        <span style={{ color: 'var(--text-muted)' }}>{alert.text}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: '16px' }}>{alert.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grace Period Requests Card */}
              {graceRequests.length > 0 && (
                <div className="card" style={{ borderRight: '4px solid var(--warning)' }}>
                  <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                    <AlertCircle size={20} />
                    <span>طلبات مهلة سماح الاشتراكات المعلقة (بانتظار موافقتك)</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {graceRequests.map((req) => (
                      <div key={req.id} style={{
                        padding: '16px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{req.tenantName}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                            المالك: {req.owner} | تاريخ الطلب: {req.date}
                          </span>
                        </div>
                        <div className="flex gap-8">
                          <button 
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success)' }}
                            onClick={() => handleApproveGrace(req.id, req.tenantName)}
                          >
                            تفعيل 3 أيام مهلة
                          </button>
                          <button 
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleRejectGrace(req.id)}
                          >
                            رفض الطلب
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Activity logs */}
              <div className="card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} className="text-primary" />
                  <span>آخر عمليات النظام والنشاطات</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { text: 'تم تسجيل متجر "بوتيك مودابيلا للملابس" بنجاح وتفعيل باقة الأعمال.', date: 'اليوم، 02:40 ص', type: 'success' },
                    { text: 'تم استلام طلب اشتراك جديد باسم "أحذية كوتشي ترند" برقم تحويل TXN778901234.', date: 'اليوم، 02:10 ص', type: 'info' },
                    { text: 'قام العميل "الحاج محمود عبده" بتسوية ديون الموردين للمرة الأولى.', date: 'أمس، 11:20 م', type: 'success' },
                    { text: 'تنبيه: اشتراك متجر "سوبرماركت المدينة المنورة" أوشك على الانتهاء.', date: 'أمس، 09:00 ص', type: 'warning' }
                  ].map((log, index) => (
                    <div key={index} style={{
                      padding: '12px 16px',
                      background: 'var(--bg-input)',
                      borderRight: `4px solid ${log.type === 'success' ? 'var(--success)' : log.type === 'warning' ? 'var(--warning)' : 'var(--info)'}`,
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13.5px'
                    }}>
                      <span>{log.text}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: TENANTS MANAGEMENT */}
          {activeTab === 'tenants' && (
            <div className="card">
              <div className="flex justify-between align-center" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={20} className="text-primary" />
                  <span>المحلات المسجلة وإعدادات المميزات والصلاحيات</span>
                </h3>
                <button className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => setShowCreateTenant(true)}>
                  <Plus size={16} />
                  <span>إضافة محل جديد</span>
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>اسم المحل / المتجر</th>
                      <th>المالك</th>
                      <th>رقم الهاتف</th>
                      <th>الباقة الحالية</th>
                      <th>حالة الحساب</th>
                      <th>تاريخ انتهاء الاشتراك</th>
                      <th style={{ textAlign: 'center' }}>التحكم والصلاحيات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: '600' }}>{t.name}</td>
                        <td>{t.owner}</td>
                        <td>{t.phone}</td>
                        <td><span className="badge info">{getPlanLabel(t.plan)}</span></td>
                        <td>
                          <span className={`badge ${t.status === 'active' ? 'success' : t.status === 'trial' ? 'warning' : 'danger'}`}>
                            {t.status === 'active' ? 'نشط ومفعل' : t.status === 'trial' ? 'تجريبي' : 'موقوف'}
                          </span>
                        </td>
                        <td>{t.expiresAt}</td>
                        <td>
                          <div className="flex gap-8 justify-center">
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px' }}
                              onClick={() => {
                                setEditingTenant(t);
                                setShowFeaturesModal(true);
                              }}
                            >
                              <Layers size={13} />
                              <span>تخصيص الميزات</span>
                            </button>
                            <button 
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '4px', background: 'rgba(79, 70, 229, 0.08)', color: 'var(--primary)' }}
                              onClick={() => handleImpersonate(t)}
                              title="دخول ومعاينة المحل فوراً"
                            >
                              <Eye size={13} />
                              <span>دخول كعميل 👁️</span>
                            </button>
                            <button 
                              className={`btn ${t.status === 'suspended' ? 'btn-primary' : 'btn-danger'}`}
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleSuspend(t.id, t.status)}
                            >
                              {t.status === 'suspended' ? 'إعادة تفعيل' : 'إيقاف مؤقت'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING PLANS CONFIGURATION */}
          {activeTab === 'plans' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} className="text-primary" />
                <span>إدارة باقات التسعير والحدود (SaaS Plan Controls)</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>
                قم بتعديل الأسعار والحدود الخاصة بالباقات. هذه التغييرات تنعكس فوراً على صفحة ترقية الاشتراك لدى العملاء.
              </p>

              <div className="grid-cols-3" style={{ alignItems: 'stretch' }}>
                {plansConfig.map((plan) => (
                  <div key={plan.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-input)' }}>
                    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>{plan.name}</strong>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>سعر الباقة (ج.م / شهرياً)</label>
                      <input 
                        type="number" 
                        value={plan.price} 
                        onChange={(e) => updatePlanConfig(plan.id, 'price', parseInt(e.target.value) || 0)} 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>الحد الأقصى للموظفين</label>
                      <input 
                        type="number" 
                        value={plan.maxUsers} 
                        onChange={(e) => updatePlanConfig(plan.id, 'maxUsers', parseInt(e.target.value) || 0)} 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>الحد الأقصى للفروع</label>
                      <input 
                        type="number" 
                        value={plan.maxBranches} 
                        onChange={(e) => updatePlanConfig(plan.id, 'maxBranches', parseInt(e.target.value) || 0)} 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>الحد الأقصى للمنتجات</label>
                      <input 
                        type="number" 
                        value={plan.maxProducts} 
                        onChange={(e) => updatePlanConfig(plan.id, 'maxProducts', parseInt(e.target.value) || 0)} 
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>مستوى الدعم الفني</label>
                      <input 
                        type="text" 
                        value={plan.support} 
                        onChange={(e) => updatePlanConfig(plan.id, 'support', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PENDING APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} className="text-warning" />
                <span>طلبات تفعيل الاشتراكات وإيصالات InstaPay المعلقة</span>
              </h3>

              {activationRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  لا توجد طلبات تفعيل معلقة حالياً. جميع المشتركين مفعلون! 🎉
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>المحل التجاري</th>
                        <th>صاحب الحساب / الهاتف</th>
                        <th>الباقة المطلوبة</th>
                        <th>المبلغ</th>
                        <th>رقم المعاملة (InstaPay)</th>
                        <th>تاريخ الإرسال</th>
                        <th>صورة الإيصال</th>
                        <th style={{ textAlign: 'center' }}>القرار</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activationRequests.map((req) => (
                        <tr key={req.id}>
                          <td style={{ fontWeight: '600' }}>{req.tenantName}</td>
                          <td>
                            <div>{req.ownerName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{req.phone}</div>
                          </td>
                          <td><span className="badge info">{getPlanLabel(req.planRequested)}</span></td>
                          <td style={{ fontWeight: 'bold' }}>{req.price} ج.م</td>
                          <td style={{ fontFamily: 'var(--font-en)' }}>{req.transactionId}</td>
                          <td>{req.date}</td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', gap: '4px' }}
                              onClick={() => setSelectedReceipt(req)}
                            >
                              <Eye size={12} />
                              <span>معاينة إثبات الدفع</span>
                            </button>
                          </td>
                          <td>
                            <div className="flex gap-8 justify-center">
                              <button 
                                className="btn btn-primary" 
                                style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--success)' }}
                                onClick={() => handleApprove(req.id, req.tenantName, req.planRequested)}
                              >
                                <CheckCircle size={12} />
                                <span>تفعيل الحساب</span>
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => handleReject(req.id, req.tenantName)}
                              >
                                <XCircle size={12} />
                                <span>رفض</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM SETTINGS & BACKUPS */}
          {activeTab === 'system' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} className="text-primary" />
                <span>إعدادات النظام والنسخ الاحتياطي السحابي</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={16} className="text-primary" />
                    <span>حفظ النسخة الاحتياطية</span>
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                    يمكنك تحميل نسخة احتياطية كاملة من قاعدة بيانات المنصة الحالية التي تحتوي على المحلات المشتركة، مبيعاتها، ميزانيتها والميزات المفعلة في ملف JSON واحد للرجوع إليه عند الطوارئ.
                  </p>
                  <button onClick={downloadBackup} className="btn btn-primary" style={{ display: 'flex', gap: '8px', padding: '10px 20px' }}>
                    <Download size={16} />
                    <span>تنزيل ملف النسخة الاحتياطية</span>
                  </button>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SettingsIcon size={16} className="text-primary" />
                    <span>إعدادات تحصيل الاشتراك</span>
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                    هنا يمكنك تعديل رقم هاتف المحفظة الإلكترونية أو عنوان انستا باي الذي تظهر تفاصيله للمحلات والعملاء ليقوموا بالتحويل عليه لتجديد باقاتهم.
                  </p>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12.5px', fontWeight: 'bold' }}>رقم تحويل انستا باي الفعال</label>
                    <input 
                      type="text" 
                      defaultValue="01143632650" 
                      style={{ direction: 'ltr', textAlign: 'left', fontWeight: 'bold' }} 
                      readOnly
                    />
                    <span style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>✓ هذا الرقم يتم استخدامه وتحديثه تلقائياً في الفواتير والاشتراكات.</span>
                  </div>
                </div>

                {/* SaaS Announcement Broadcast Composer */}
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gridColumn: 'span 2' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} className="text-primary" />
                    <span>بث إعلان عام للمنصة (SaaS Broadcast)</span>
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>
                    اكتب رسالة تظهر كإعلان ملون في أعلى شريط لوحة التحكم لجميع المتاجر المشتركة فوراً.
                  </p>
                  <form onSubmit={handlePublishBroadcast}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>نص الإعلان للمشتركين *</label>
                      <textarea 
                        value={broadcastText} 
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="مثال: تم تفعيل ميزة الفروع الجديدة! يرجى تحديث الصفحة لمشاهدتها..."
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    <div className="flex gap-16 align-center" style={{ flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>المجموعة المستهدفة بالبث</label>
                        <select value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)}>
                          <option value="all">الجميع (ملاك، مدراء، موظفون)</option>
                          <option value="owner">ملاك المحلات فقط</option>
                          <option value="manager">مدراء الفروع فقط</option>
                          <option value="cashier">الكاشير والموظفين فقط</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label>نوع ولون التنبيه</label>
                        <select value={broadcastType} onChange={(e) => setBroadcastType(e.target.value)}>
                          <option value="info">أزرق (معلومات وتحديثات)</option>
                          <option value="warning">برتقالي (تنبيه هام)</option>
                          <option value="success">أخضر (تهاني وعروض)</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>بث التنبيه 📣</button>
                        {localStorage.getItem('mizan_broadcast') && (
                          <button type="button" onClick={handleClearBroadcast} className="btn btn-danger" style={{ padding: '8px 16px' }}>حذف البث الفعال</button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* TAB 6: DB SIZE MONITOR */}
      {activeTab === 'db_monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={24} className="text-primary" />
                  <span>مراقب الخوادم وقواعد البيانات (DB Monitor)</span>
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  إحصائيات حية لاستهلاك المتاجر لمساحة التخزين وسجلات النظام.
                </p>
              </div>
              <div style={{ padding: '8px 16px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}>
                المساحة الكلية المستخدمة: {Math.round(tenants.reduce((acc, t) => {
                  const pCount = t.plan === 'starter' ? 84 : t.plan === 'business' ? 340 : 1240;
                  const iCount = t.invoicesCount || (t.plan === 'starter' ? 12 : t.plan === 'business' ? 95 : 450);
                  const sCount = t.plan === 'starter' ? 2 : t.plan === 'business' ? 4 : 12;
                  const bCount = t.plan === 'starter' ? 1 : t.plan === 'business' ? 2 : 4;
                  return acc + ((pCount * 0.4) + (iCount * 0.6) + (sCount * 0.2) + (bCount * 0.2));
                }, 0)).toLocaleString()} KB
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {tenants.map(t => {
                const productCount = t.plan === 'starter' ? 84 : t.plan === 'business' ? 340 : 1240;
                const invoicesCount = t.invoicesCount || (t.plan === 'starter' ? 12 : t.plan === 'business' ? 95 : 450);
                const staffCount = t.plan === 'starter' ? 2 : t.plan === 'business' ? 4 : 12;
                const branchesCount = t.plan === 'starter' ? 1 : t.plan === 'business' ? 2 : 4;
                
                const estKb = Math.round((productCount * 0.4) + (invoicesCount * 0.6) + (staffCount * 0.2) + (branchesCount * 0.2));
                const limitKb = t.plan === 'starter' ? 500 : t.plan === 'business' ? 2000 : 10000;
                const usagePercent = Math.min((estKb / limitKb) * 100, 100);
                
                const isWarning = usagePercent > 80;
                const isDanger = usagePercent > 95;

                return (
                  <div key={t.id} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    background: 'var(--bg-main)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }} className="card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{t.name}</h4>
                      <span className={`badge ${t.plan === 'starter' ? 'secondary' : t.plan === 'business' ? 'primary' : 'success'}`} style={{ fontSize: '11px' }}>
                        {t.plan === 'starter' ? 'مبتدئة' : t.plan === 'business' ? 'أعمال' : 'احترافية'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>المنتجات</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{productCount}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الفواتير</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{invoicesCount}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الموظفين</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{staffCount}</div>
                      </div>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الفروع</div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{branchesCount}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                        <span>استهلاك المساحة</span>
                        <span style={{ color: isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--text-main)' }}>
                          {estKb.toLocaleString()} / {limitKb.toLocaleString()} KB
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${usagePercent}%`, 
                          background: isDanger ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--success)',
                          transition: 'width 0.5s ease-out'
                        }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feature Customization Modal */}
      {showFeaturesModal && editingTenant && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>تخصيص ميزات متجر: {editingTenant.name}</h3>
              <XCircle className="modal-close" onClick={() => setShowFeaturesModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                تفعيل أو إلغاء الميزات والصلاحيات المتاحة لهذا المحل في حسابه الخاص فوراً:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'pos', name: 'كاشير المبيعات (POS)' },
                  { key: 'inventory', name: 'إدارة المخازن والجرد' },
                  { key: 'suppliers', name: 'شؤون الموردين والديون' },
                  { key: 'customers', name: 'حسابات العملاء ونقاط الولاء' },
                  { key: 'expenses', name: 'إدارة المصاريف اليومية' },
                  { key: 'reports', name: 'التقارير والإحصاءات' },
                  { key: 'users', name: 'إدارة الموظفين والشيفتات' },
                  { key: 'branches', name: 'تعدد الفروع الجغرافية' },
                  { key: 'clothingSpecs', name: 'مواصفات الملابس والأحذية (ألوان/مقاسات)' },
                  { key: 'carpetSpecs', name: 'مواصفات السجاد والأقمشة (الأبعاد)' },
                  { key: 'supermarketSpecs', name: 'مواصفات السوبرماركت والأغذية (الوزن والصلاحية)' }
                ].map(item => (
                  <div key={item.key} className="flex align-center justify-between" style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <label htmlFor={`modal-feat-${item.key}`} style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold' }}>
                      {item.name}
                    </label>
                    <input 
                      type="checkbox" 
                      id={`modal-feat-${item.key}`}
                      checked={selectedTenantFeatures[item.key]}
                      onChange={() => {
                        setSelectedTenantFeatures({
                          ...selectedTenantFeatures,
                          [item.key]: !selectedTenantFeatures[item.key]
                        });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFeaturesModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={saveFeatures}>حفظ الإعدادات</button>
            </div>
          </div>
        </div>
      )}

      {/* InstaPay Receipt Screenshot Modal */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>إيصال تحويل InstaPay</h3>
              <XCircle className="modal-close" onClick={() => setSelectedReceipt(null)} />
            </div>

            <div style={{ padding: '16px 0' }}>
              <div style={{ 
                width: '100%', 
                height: '320px', 
                background: '#f1f5f9', 
                borderRadius: '8px', 
                border: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#475569'
              }}>
                <CreditCard size={48} className="text-primary" />
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>إيصال تحويل إلكتروني مقبول</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>{selectedReceipt.price} ج.م</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>Txn Ref: {selectedReceipt.transactionId}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>المستلم: {selectedReceipt.ownerName}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.5' }}>
                لقطة شاشة رقمية تؤكد سلامة عملية تحويل الاشتراك لباقة <strong>{selectedReceipt.planRequested}</strong>.
              </p>
            </div>

            <div className="modal-footer" style={{ width: '100%' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedReceipt(null)}>إغلاق المعاينة</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--success)' }}
                onClick={() => {
                  handleApprove(selectedReceipt.id, selectedReceipt.tenantName, selectedReceipt.planRequested);
                  setSelectedReceipt(null);
                }}
              >
                تأكيد وقبول الاشتراك
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Tenant Modal */}
      {showCreateTenant && (
        <div className="modal-overlay" style={{ animation: 'fadeIn 0.15s ease' }}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>إضافة متجر / محل جديد</h3>
              <button className="modal-close" onClick={() => setShowCreateTenant(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTenant}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>اسم المحل / المتجر *</label>
                  <input 
                    type="text" 
                    value={createTenantForm.name} 
                    onChange={e => setCreateTenantForm({...createTenantForm, name: e.target.value})} 
                    placeholder="مثال: بوتيك مودابيلا"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>اسم المالك *</label>
                  <input 
                    type="text" 
                    value={createTenantForm.owner} 
                    onChange={e => setCreateTenantForm({...createTenantForm, owner: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>رقم الهاتف *</label>
                  <input 
                    type="text" 
                    value={createTenantForm.phone} 
                    onChange={e => setCreateTenantForm({...createTenantForm, phone: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>البريد الإلكتروني (اختياري)</label>
                  <input 
                    type="email" 
                    value={createTenantForm.email} 
                    onChange={e => setCreateTenantForm({...createTenantForm, email: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>كلمة المرور الافتراضية *</label>
                  <input 
                    type="text" 
                    value={createTenantForm.password} 
                    onChange={e => setCreateTenantForm({...createTenantForm, password: e.target.value})} 
                    placeholder="سيستخدمها المالك للدخول"
                    required 
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>خطة الاشتراك (الباقة)</label>
                  <select 
                    value={createTenantForm.plan} 
                    onChange={e => setCreateTenantForm({...createTenantForm, plan: e.target.value})}
                  >
                    {plansConfig.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.price}/شهر</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px' }}>صلاحيات وخصائص المتجر (حسب الباقة)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--bg-hover)', padding: '12px', borderRadius: '8px' }}>
                  {Object.entries(createTenantForm.features).map(([key, value]) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={value}
                        onChange={e => setCreateTenantForm({
                          ...createTenantForm,
                          features: { ...createTenantForm.features, [key]: e.target.checked }
                        })}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateTenant(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} />
                  إضافة المتجر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
