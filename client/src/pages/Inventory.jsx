import React, { useState } from 'react';
import { 
  Boxes, 
  ArrowUpDown, 
  Search, 
  Plus, 
  Minus, 
  History, 
  Check, 
  X, 
  Download,
  AlertTriangle,
  ClipboardList,
  Send,
  User,
  AlertCircle
} from 'lucide-react';
import { products as initialProducts } from '../data/mockData';

const Inventory = () => {
  // Get active session user
  const user = JSON.parse(localStorage.getItem('mizan_user')) || null;

  // Sync products list with localStorage
  const [productsList, setProductsList] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_products')) || initialProducts;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, low, out
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('جرد دوري');

  // Multi-step Inventory Sessions States
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [sessions, setSessions] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_inventory_sessions')) || [
      { 
        id: 's1', 
        staffName: 'كريم محمود', 
        assignedProducts: ['p1', 'p2'], 
        counts: { p1: 8, p2: 15 }, 
        status: 'awaiting_manager', 
        date: '2026-07-12 03:00', 
        notes: 'جرد أرفف الفساتين والبلوزات الصيفية' 
      }
    ];
  });

  // Session count inputs for employee view
  const [activeSessionToCount, setActiveSessionToCount] = useState(null);
  const [employeeInputs, setEmployeeInputs] = useState({}); // { productId: countedQty }

  // Review dialog states
  const [selectedSessionToReview, setSelectedSessionToReview] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Form states to create a session
  const [sessionStaff, setSessionStaff] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionProductIds, setSessionProductIds] = useState([]);

  // Load available shop staff to assign tasks
  const shopUsers = JSON.parse(localStorage.getItem('mizan_users')) || [
    { id: 'u1', name: 'سارة أحمد', role: 'cashier' },
    { id: 'u2', name: 'كريم محمود', role: 'staff' },
    { id: 'u3', name: 'خالد صبري', role: 'staff' }
  ];
  const staffList = shopUsers.filter(u => u.role === 'staff' || u.role === 'cashier');

  // Stock movement logs
  const [movementLog, setMovementLog] = useState(() => {
    return JSON.parse(localStorage.getItem('mizan_stock_movements')) || [
      { id: 'l1', date: '2026-07-12 01:10', product: 'فستان سواريه مطرز', delta: -1, reason: 'مبيعات (inv-1001)', user: 'سارة أحمد' },
      { id: 'l2', date: '2026-07-12 00:45', product: 'بلوزة شيفون كاجوال', delta: -2, reason: 'مبيعات (inv-1002)', user: 'سارة أحمد' },
      { id: 'l3', date: '2026-07-11 22:30', product: 'جيب بليسيه أسود', delta: -1, reason: 'مبيعات (inv-1003)', user: 'كريم محمود' }
    ];
  });

  const filteredProducts = productsList.filter(p => {
    const matchesSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
    if (filterType === 'low') {
      return matchesSearch && p.stock <= p.minStock && p.stock > 0;
    }
    if (filterType === 'out') {
      return matchesSearch && p.stock <= 0;
    }
    return matchesSearch;
  });

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustQty(0);
    setAdjustReason('جرد دوري');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (adjustQty === 0) {
      alert('من فضلك أدخل قيمة تعديل صالحة (موجبة أو سالبة)!');
      return;
    }

    const currentStock = selectedProduct.stock;
    const finalStock = currentStock + adjustQty;

    if (finalStock < 0) {
      alert('الكمية النهائية لا يمكن أن تكون أقل من الصفر!');
      return;
    }

    // Update product stock
    const updated = productsList.map(p => 
      p.id === selectedProduct.id ? { ...p, stock: finalStock } : p
    );
    setProductsList(updated);
    localStorage.setItem('mizan_products', JSON.stringify(updated));

    // Log the movement
    const newLog = {
      id: 'l' + (movementLog.length + 1),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      product: selectedProduct.name,
      delta: adjustQty,
      reason: adjustReason,
      user: user?.name || 'المالك'
    };

    const updatedLogs = [newLog, ...movementLog];
    setMovementLog(updatedLogs);
    localStorage.setItem('mizan_stock_movements', JSON.stringify(updatedLogs));
    setShowAdjustModal(false);
  };

  // Create a new stocktake session
  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!sessionStaff || sessionProductIds.length === 0) {
      alert('الرجاء اختيار الموظف والمنتجات المراد جردها!');
      return;
    }

    const newSession = {
      id: 'sess_' + Date.now(),
      staffName: sessionStaff,
      assignedProducts: sessionProductIds,
      counts: {},
      status: 'assigned',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: sessionNotes
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    localStorage.setItem('mizan_inventory_sessions', JSON.stringify(updated));
    setShowCreateSessionModal(false);
    setSessionNotes('');
    setSessionProductIds([]);
    alert(`تم إسناد مهمة الجرد للموظف (${sessionStaff}) بنجاح! 📡`);
  };

  // Staff submits counts
  const handleStaffSubmitCount = (e) => {
    e.preventDefault();
    const updated = sessions.map(sess => {
      if (sess.id === activeSessionToCount.id) {
        return {
          ...sess,
          counts: employeeInputs,
          status: 'awaiting_manager'
        };
      }
      return sess;
    });

    setSessions(updated);
    localStorage.setItem('mizan_inventory_sessions', JSON.stringify(updated));
    setActiveSessionToCount(null);
    setEmployeeInputs({});
    alert('تم إرسال الجرد الأعمى بنجاح إلى مدير الفرع للمراجعة! 📤');
  };

  // Manager forwards to Shop Owner
  const handleManagerForward = () => {
    const updated = sessions.map(sess => {
      if (sess.id === selectedSessionToReview.id) {
        return {
          ...sess,
          status: 'awaiting_owner',
          managerNotes: reviewNotes
        };
      }
      return sess;
    });

    setSessions(updated);
    localStorage.setItem('mizan_inventory_sessions', JSON.stringify(updated));
    setSelectedSessionToReview(null);
    setReviewNotes('');
    alert('تمت مراجعة الجرد وإرساله للمالك للاعتماد النهائي وتحديث المخزن! 📤');
  };

  // Owner commits final count and settles stock
  const handleOwnerApprove = (session) => {
    let updatedProducts = [...productsList];
    const newLogs = [];

    session.assignedProducts.forEach(prodId => {
      const counted = session.counts[prodId] || 0;
      const originalProduct = productsList.find(p => p.id === prodId);
      if (originalProduct) {
        const diff = counted - originalProduct.stock;
        
        // Settle stock quantity
        updatedProducts = updatedProducts.map(p => 
          p.id === prodId ? { ...p, stock: counted } : p
        );

        if (diff !== 0) {
          newLogs.push({
            id: 'l_audit_' + Math.random().toString(36).substring(2, 6),
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            product: originalProduct.name,
            delta: diff,
            reason: `تسوية جرد أعمى (معتمد من أدمن المحل)`,
            user: session.staffName
          });
        }
      }
    });

    // Save products
    setProductsList(updatedProducts);
    localStorage.setItem('mizan_products', JSON.stringify(updatedProducts));

    // Save logs
    const updatedLogs = [...newLogs, ...movementLog];
    setMovementLog(updatedLogs);
    localStorage.setItem('mizan_stock_movements', JSON.stringify(updatedLogs));

    // Update session status
    const updatedSessions = sessions.map(sess => 
      sess.id === session.id ? { ...sess, status: 'completed' } : sess
    );
    setSessions(updatedSessions);
    localStorage.setItem('mizan_inventory_sessions', JSON.stringify(updatedSessions));

    alert('تم اعتماد الجرد بنجاح! تم تسوية الفروقات وتعديل المخزن بالكميات الفعلية. ✅');
  };

  const handleRejectSession = (sessId) => {
    if (window.confirm('هل تريد إلغاء أو رفض مهمة الجرد هذه؟')) {
      const updated = sessions.filter(s => s.id !== sessId);
      setSessions(updated);
      localStorage.setItem('mizan_inventory_sessions', JSON.stringify(updated));
    }
  };

  // ==================== RENDER STAFF VIEW ====================
  if (user?.role === 'staff') {
    const mySessions = sessions.filter(s => s.staffName === user.name && s.status === 'assigned');

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'var(--font-ar)' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>مهام الجرد المسندة 🔍</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '24px' }}>
          هنا تظهر جلسات الجرد المكلف بها لجرد الرفوف وإدخال الكميات الفعلية أعمى.
        </p>

        {activeSessionToCount ? (
          <div className="card">
            <h3 style={{ fontSize: '16.5px', marginBottom: '12px' }}>جاري الجرد: {activeSessionToCount.notes || 'جرد رفوف'}</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              الرجاء عد القطع المتوفرة بالمعرض وإدخال الرقم الفعلي لكل منتج بدون تلميحات.
            </p>

            <form onSubmit={handleStaffSubmitCount}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {activeSessionToCount.assignedProducts.map(prodId => {
                  const prod = productsList.find(p => p.id === prodId);
                  if (!prod) return null;
                  return (
                    <div key={prodId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{prod.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>باركود: {prod.barcode}</span>
                      </div>
                      <input 
                        type="number" 
                        placeholder="الكمية الفعلية بالقطعة" 
                        value={employeeInputs[prodId] ?? ''}
                        onChange={(e) => setEmployeeInputs({
                          ...employeeInputs,
                          [prodId]: e.target.value === '' ? '' : parseInt(e.target.value) || 0
                        })}
                        style={{ width: '130px', textAlign: 'center', fontSize: '15px' }}
                        required
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveSessionToCount(null)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <Send size={14} />
                  <span>إرسال الجرد للمدير 📤</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mySessions.map(sess => (
              <div key={sess.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: '4px solid var(--primary)' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', fontSize: '15px' }}>{sess.notes || 'جلسة جرد رفوف'}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>تاريخ التكليف: {sess.date} | عدد المنتجات: {sess.assignedProducts.length} أصناف</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                  onClick={() => {
                    const inputs = {};
                    sess.assignedProducts.forEach(id => {
                      inputs[id] = '';
                    });
                    setEmployeeInputs(inputs);
                    setActiveSessionToCount(sess);
                  }}
                >
                  بدء العد الفعلي
                </button>
              </div>
            ))}

            {mySessions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                👍 لا توجد مهام جرد معلقة مسندة إليك حالياً.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==================== RENDER OWNER / MANAGER VIEW ====================
  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة المخزون والتعديلات</h1>
          <p style={{ color: 'var(--text-muted)' }}>مراقبة كميات المنتجات، إجراء تسويات المخزن وجرد النواقص.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => setShowCreateSessionModal(true)}>
            <ClipboardList size={18} />
            <span>تكليف موظف بجلسة جرد 📋</span>
          </button>
          
          <button className="btn btn-secondary">
            <Download size={18} />
            <span>تصدير المخزون (Excel)</span>
          </button>
        </div>
      </div>

      {/* Multi-step Sessions Review Section */}
      <div className="card mb-24">
        <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={20} className="text-primary" />
          <span>متابعة لجان وجلسات الجرد النشطة</span>
        </h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الموظف المكلف</th>
                <th>التاريخ</th>
                <th>أصناف الجرد</th>
                <th>ملاحظات التكليف</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الاعتماد / الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(sess => (
                <tr key={sess.id}>
                  <td style={{ fontWeight: '600' }}>{sess.staffName}</td>
                  <td>{sess.date}</td>
                  <td>{sess.assignedProducts.length} أصناف</td>
                  <td>{sess.notes || 'بلا ملاحظات'}</td>
                  <td>
                    <span className={`badge ${
                      sess.status === 'assigned' ? 'secondary' : 
                      sess.status === 'awaiting_manager' ? 'warning' : 
                      sess.status === 'awaiting_owner' ? 'primary' : 'success'
                    }`}>
                      {sess.status === 'assigned' ? 'جاري العد (أعمى)' : 
                       sess.status === 'awaiting_manager' ? 'بانتظار مراجعة المدير' : 
                       sess.status === 'awaiting_owner' ? 'بانتظار موافقة المالك' : 'تم التسوية والاعتماد ✅'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      {sess.status === 'awaiting_manager' && user?.role === 'manager' && (
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--warning-glow)', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                          onClick={() => {
                            setSelectedSessionToReview(sess);
                            setReviewNotes('');
                          }}
                        >
                          مراجعة وإرسال للمالك
                        </button>
                      )}
                      
                      {sess.status === 'awaiting_owner' && user?.role === 'owner' && (
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--success)', color: '#fff' }}
                          onClick={() => handleOwnerApprove(sess)}
                        >
                          اعتماد وتعديل المخزن
                        </button>
                      )}

                      {sess.status !== 'completed' && (
                        <button 
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                          onClick={() => handleRejectSession(sess.id)}
                        >
                          إلغاء
                        </button>
                      )}

                      {sess.status === 'completed' && (
                        <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 'bold' }}>معتمد بالكامل</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    لا توجد أي لجان جرد نشطة حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products table list view */}
      <div className="card">
        <div className="flex justify-between align-center mb-16" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '18px' }}>حالة المخزون الحالي بالمعرض</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="header-search" style={{ margin: 0, width: '220px' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الباركود..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
              <option value="all">كل المخزون</option>
              <option value="low">النواقص (تحت حد الأمان)</option>
              <option value="out">النفاد (صفر قطعة)</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>اسم المنتج</th>
                <th>الباركود</th>
                <th>المخزون الحالي</th>
                <th>حد الأمان</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>تعديل يدوي</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600' }}>{p.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.barcode}</td>
                  <td style={{ fontWeight: 'bold' }}>{p.stock} {p.unit}</td>
                  <td>{p.minStock} {p.unit}</td>
                  <td>
                    {p.stock <= 0 ? (
                      <span className="badge danger">نفاد الكمية</span>
                    ) : p.stock <= p.minStock ? (
                      <span className="badge warning">نواقص / أوشك</span>
                    ) : (
                      <span className="badge success">متوفر</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => openAdjustModal(p)}
                      >
                        تعديل فوري
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateSessionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>تكليف موظف بجلسة جرد جديدة 📋</h3>
              <X className="modal-close" onClick={() => setShowCreateSessionModal(false)} />
            </div>

            <form onSubmit={handleCreateSession}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>الموظف المكلف بالجرد *</label>
                  <select value={sessionStaff} onChange={(e) => setSessionStaff(e.target.value)} required>
                    <option value="">اختر الموظف...</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.role === 'cashier' ? 'كاشير' : st.role === 'manager' ? 'مدير' : 'موظف'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>ملاحظات التكليف (اسم الرف / القسم) *</label>
                  <input 
                    type="text" 
                    value={sessionNotes} 
                    onChange={(e) => setSessionNotes(e.target.value)} 
                    placeholder="مثال: جرد رفوف فساتين السهرة بالمعرض"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>اختر الأصناف المراد جردها (صنف واحد على الأقل) *</label>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productsList.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input 
                          type="checkbox" 
                          checked={sessionProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSessionProductIds([...sessionProductIds, p.id]);
                            } else {
                              setSessionProductIds(sessionProductIds.filter(id => id !== p.id));
                            }
                          }}
                          style={{ width: 'auto' }}
                        />
                        <span>{p.name} (باركود: {p.barcode})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateSessionModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">إرسال التكليف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Review Modal */}
      {selectedSessionToReview && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>مراجعة جرد الموظف: {selectedSessionToReview.staffName} 🔍</h3>
              <X className="modal-close" onClick={() => setSelectedSessionToReview(null)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: '8px', fontSize: '12.5px' }}>
                <div>تاريخ التكليف: <strong>{selectedSessionToReview.date}</strong></div>
                <div>وصف المهمة: <strong>{selectedSessionToReview.notes}</strong></div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>المنتج</th>
                      <th>المسجل بالسيستم</th>
                      <th>عدّ الموظف</th>
                      <th>الفارق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSessionToReview.assignedProducts.map(prodId => {
                      const prod = productsList.find(p => p.id === prodId);
                      const expected = prod ? prod.stock : 0;
                      const counted = selectedSessionToReview.counts[prodId] ?? 0;
                      const diff = counted - expected;
                      
                      return (
                        <tr key={prodId}>
                          <td>{prod ? prod.name : 'منتج محذوف'}</td>
                          <td style={{ fontWeight: 'bold' }}>{expected} قطعة</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{counted} قطعة</td>
                          <td style={{ fontWeight: 'bold', color: diff === 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="form-group">
                <label>ملاحظات وتدقيق المدير *</label>
                <textarea 
                  value={reviewNotes} 
                  onChange={(e) => setReviewNotes(e.target.value)} 
                  placeholder="اكتب أي ملاحظات للمالك بشأن العجز أو الزيادة بالقطع المجرودة..." 
                  style={{ width: '100%', padding: '10px', height: '60px', borderRadius: '6px' }}
                  required
                />
              </div>

              <div className="modal-footer" style={{ border: 'none', padding: '10px 0 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedSessionToReview(null)}>إلغاء</button>
                <button type="button" className="btn btn-primary" onClick={handleManagerForward} disabled={!reviewNotes.trim()}>
                  تأكيد الإرسال للمالك
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>تعديل مخزون منتج يدوي</h3>
              <X className="modal-close" onClick={() => setShowAdjustModal(false)} />
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--bg-hover)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                  المنتج: <strong>{selectedProduct.name}</strong> <br />
                  المخزون المسجل الحالي بالرف: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong>
                </div>

                <div className="form-group">
                  <label>قيمة التعديل (أدخل قيمة موجبة للإضافة، وسالبة للخصم) *</label>
                  <input 
                    type="number" 
                    value={adjustQty} 
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} 
                    placeholder="مثال: 5 أو -5"
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>سبب التعديل والتعليق *</label>
                  <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} required>
                    <option value="جرد دوري">جرد دوري</option>
                    <option value="تلف بضاعة">تلف بضاعة / هالك</option>
                    <option value="خطأ إدخال">خطأ إدخال سابق</option>
                    <option value="تعديل مباشر">تعديل مباشر للمخزن</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">تأكيد التعديل</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
