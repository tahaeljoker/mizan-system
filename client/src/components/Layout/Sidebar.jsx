import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  ClipboardList,
  Truck,
  Users,
  BarChart3,
  UserCog,
  Store,
  CreditCard,
  Settings,
  DollarSign,
  ChevronDown,
  ChevronUp,
  LogOut,
  Tag,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const location = useLocation();

  // Get active session user
  const user = JSON.parse(localStorage.getItem('mizan_user')) || null;

  // Get features from localStorage or default to all true
  const storedFeatures = JSON.parse(localStorage.getItem('mizan_features')) || {
    pos: true,
    inventory: true,
    purchases: true,
    suppliers: true,
    customers: true,
    reports: true,
    users: true,
    branches: true,
    expenses: true
  };

  // State to track which menu groups are expanded
  const [expandedGroups, setExpandedGroups] = useState({
    sales: true,
    inventory_group: true,
    hr: false,
    reports_settings: false
  });

  // Auto expand parent group on route change
  useEffect(() => {
    const path = location.pathname;
    if (['/pos', '/customers', '/expenses', '/price-checker', '/returns'].includes(path)) {
      setExpandedGroups(prev => ({ ...prev, sales: true }));
    } else if (['/products', '/inventory', '/suppliers'].includes(path)) {
      setExpandedGroups(prev => ({ ...prev, inventory_group: true }));
    } else if (['/branches', '/users'].includes(path)) {
      setExpandedGroups(prev => ({ ...prev, hr: true }));
    } else if (['/billing', '/settings', '/reports'].includes(path)) {
      setExpandedGroups(prev => ({ ...prev, reports_settings: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (groupId) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupId]: !expandedGroups[groupId]
    });
  };

  // Get localized role description
  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'المالك';
      case 'manager': return 'مدير الفرع';
      case 'cashier': return 'الكاشير';
      case 'staff': return 'موظف جرد';
      default: return 'المشرف';
    }
  };

  // Build menuGroups dynamically based on user role
  const getMenuGroups = () => {
    if (user?.role === 'staff') {
      return [
        {
          id: 'sales',
          name: 'صالة العرض والبحث',
          icon: ShoppingBag,
          items: [
            { path: '/price-checker', name: 'استعلام الأسعار' }
          ]
        },
        {
          id: 'inventory_group',
          name: 'المخازن والجرد',
          icon: Boxes,
          items: [
            { path: '/inventory', name: 'جلسات الجرد المسندة' }
          ]
        }
      ];
    }

    if (user?.role === 'cashier') {
      return [
        {
          id: 'sales',
          name: 'المبيعات والكاشير',
          icon: ShoppingBag,
          items: [
            storedFeatures.pos && { path: '/pos', name: 'شاشة الكاشير (POS)' },
            { path: '/price-checker', name: 'استعلام الأسعار' },
            { path: '/cashier-shift', name: 'خزنة الكاشير وتقفيل الوردية' },
            { path: '/returns', name: 'إدارة المرتجعات' }
          ].filter(Boolean)
        }
      ];
    }

    // Normal Owner / Manager list
    return [
      {
        id: 'sales',
        name: 'المبيعات والكاشير',
        icon: ShoppingBag,
        items: [
          storedFeatures.pos && { path: '/pos', name: 'شاشة الكاشير (POS)' },
          { path: '/price-checker', name: 'استعلام الأسعار' },
          { path: '/cashier-shift', name: 'خزنة الكاشير وتقفيل الوردية' },
          { path: '/returns', name: 'إدارة المرتجعات' },
          storedFeatures.customers && { path: '/customers', name: 'العملاء والولاء' },
          storedFeatures.expenses && { path: '/expenses', name: 'المصاريف اليومية' }
        ].filter(Boolean)
      },
      {
        id: 'inventory_group',
        name: 'المخازن والبضائع',
        icon: Boxes,
        items: [
          { path: '/products', name: 'الأصناف والمنتجات' },
          storedFeatures.inventory && { path: '/inventory', name: 'حركة المخزن وجلسات الجرد' },
          storedFeatures.inventory && { path: '/transfer-logs', name: 'التحويلات بين الفروع' },
          storedFeatures.purchases && { path: '/purchase-orders', name: 'أوامر الشراء والتوريد' },
          storedFeatures.suppliers && { path: '/suppliers', name: 'الموردين وفواتير الشراء' }
        ].filter(Boolean)
      },
      {
        id: 'hr',
        name: 'الفروع والموظفين',
        icon: Store,
        items: [
          storedFeatures.branches && { path: '/branches', name: 'إدارة الفروع' },
          user?.role === 'owner' && storedFeatures.users && { path: '/users', name: 'الموظفين والصلاحيات' }
        ].filter(Boolean)
      },
      {
        id: 'reports_settings',
        name: 'التقارير والنظام',
        icon: BarChart3,
        items: [
          storedFeatures.reports && { path: '/reports', name: 'التقارير والإحصائيات' },
          user?.role === 'owner' && { path: '/billing', name: 'اشتراك ميزان والفواتير' },
          { path: '/settings', name: 'إعدادات الفرع والحساب' }
        ].filter(Boolean)
      }
    ].filter(group => group.items.length > 0);
  };

  const menuGroups = getMenuGroups();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo">M</div>
          <div className="sidebar-title">مِيزان</div>
        </div>
        <button 
          onClick={toggleSidebar}
          className="sidebar-close-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      <ul className="sidebar-menu" style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
        {/* Main Dashboard Link - Hidden for staff/cashiers who go straight to their workspace */}
        {user?.role !== 'staff' && user?.role !== 'cashier' && (
          <li className="sidebar-item" onClick={toggleSidebar} style={{ marginBottom: '8px' }}>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? "active" : ""}
              end
            >
              <LayoutDashboard size={20} />
              <span style={{ fontWeight: '600' }}>لوحة التحكم الرئيسية</span>
            </NavLink>
          </li>
        )}

        {/* Grouped Accordion Submenus */}
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.id];

          return (
            <li key={group.id} style={{ marginBottom: '12px' }}>
              {/* Group Header Button */}
              <div 
                onClick={() => toggleGroup(group.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '10px 14px', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  background: isExpanded ? 'var(--bg-hover)' : 'transparent',
                  transition: 'background var(--transition-fast)'
                }}
                className="group-header"
              >
                <div className="flex align-center gap-8">
                  <GroupIcon size={18} style={{ color: isExpanded ? 'var(--primary)' : 'inherit' }} />
                  <span style={{ fontWeight: '700', fontSize: '13.5px', color: isExpanded ? 'var(--text-main)' : 'inherit' }}>{group.name}</span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {/* Sub-items (collapsible list) */}
              {isExpanded && (
                <ul style={{ listStyle: 'none', paddingRight: '22px', borderRight: '1px solid var(--border)', marginRight: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {group.items.map((item) => (
                    <li className="sidebar-item" key={item.path} onClick={toggleSidebar}>
                      <NavLink 
                        to={item.path} 
                        className={({ isActive }) => isActive ? "active" : ""}
                        style={{ padding: '8px 12px', fontSize: '12.5px', borderRadius: '8px' }}
                      >
                        <span>{item.name}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="user-avatar" style={{ background: 'var(--primary)', color: '#fff', fontWeight: 'bold' }}>
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'ME'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'طه أنس'}</span>
            <span className="user-role" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getRoleLabel(user?.role)}</span>
          </div>
        </div>
        <button 
          onClick={onLogout}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--danger)', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="تسجيل الخروج"
          className="action-btn"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
