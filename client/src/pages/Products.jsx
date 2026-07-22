import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Barcode, 
  Image as ImageIcon,
  Printer
} from 'lucide-react';
import { products as initialProducts, categories } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';
import ReactBarcode from 'react-barcode';
import Papa from 'papaparse';
import { Upload } from 'lucide-react';

import apiService from '../services/api';

const Products = () => {
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.products.getAll();
        setProductsList(data);
      } catch (err) {
        console.warn('Failed fetching products from MongoDB, loading from localStorage:', err.message);
        const localProds = JSON.parse(localStorage.getItem('mizan_products')) || initialProducts;
        setProductsList(localProds);
      }
    };
    fetchProducts();
  }, []);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productCategories, setProductCategories] = useState(categories);

  // Load SaaS admin features config
  const storedFeatures = JSON.parse(localStorage.getItem('mizan_features')) || {
    clothingSpecs: true,
    carpetSpecs: true,
    supermarketSpecs: true
  };
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Barcode Printing States
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  
  // Form states with multi-industry specs
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: 'dresses',
    costPrice: '',
    sellPrice: '',
    wholesalePrice: '',
    stock: '',
    minStock: '',
    unit: 'قطعة',
    colors: '',
    sizes: '',
    dimensions: '',
    expiryDate: '',
    weightVolume: ''
  });

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState({ isOpen: false, id: null });

  // Dead stock analyzer filter state
  const [showOnlyDeadStock, setShowOnlyDeadStock] = useState(false);

  // Duplicate product warning state
  const [dupWarning, setDupWarning] = useState(null);

  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.includes(searchQuery) || p.barcode.includes(searchQuery);
    
    // Dead stock is defined as no sales in the last 60 days (i.e. lastSoldDate is older than 60 days from 2026-07-12)
    let matchesDeadStock = true;
    if (showOnlyDeadStock) {
      if (!p.lastSoldDate) {
        matchesDeadStock = true; // Never sold sits in stock
      } else {
        const diffTime = Math.abs(new Date('2026-07-12') - new Date(p.lastSoldDate));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesDeadStock = diffDays > 60;
      }
    }
    
    return matchesCategory && matchesSearch && matchesDeadStock;
  });

  const generateSKU = () => 'MZN-' + Math.floor(1000 + Math.random() * 9000);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: generateSKU(),
      barcode: Math.floor(6221000000 + Math.random() * 999999).toString(),
      category: 'dresses',
      costPrice: '',
      sellPrice: '',
      wholesalePrice: '',
      stock: '',
      minStock: '5',
      unit: 'قطعة',
      colors: '',
      sizes: '',
      dimensions: '',
      expiryDate: '',
      weightVolume: ''
    });
    setDupWarning(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || generateSKU(),
      barcode: product.barcode,
      category: product.category,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      wholesalePrice: product.wholesalePrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      colors: product.colors || '',
      sizes: product.sizes || '',
      dimensions: product.dimensions || '',
      expiryDate: product.expiryDate || '',
      weightVolume: product.weightVolume || ''
    });
    setDupWarning(null);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmState({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      const targetId = confirmState.id;
      // If the product has a real MongoDB ID (24-char hex or similar), delete via API
      if (targetId.length > 8) {
        await apiService.products.delete(targetId);
      }
      const data = await apiService.products.getAll();
      setProductsList(data);
    } catch (err) {
      console.warn('Failed deleting from MongoDB, falling back to local storage:', err.message);
      setProductsList(prev => {
        const updated = prev.filter(p => p.id !== confirmState.id && p._id !== confirmState.id);
        localStorage.setItem('mizan_products', JSON.stringify(updated));
        return updated;
      });
    }
    setConfirmState({ isOpen: false, id: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.errors.length > 0) {
          alert('حدث خطأ في قراءة الملف، تأكد من صحة البيانات واسم الأعمدة.');
          return;
        }
        
        const importedProducts = results.data.map((row, index) => ({
          id: 'p-import-' + Date.now() + '-' + index,
          name: row['اسم المنتج'] || row.name || 'منتج جديد',
          sku: row['الكود'] || row.sku || generateSKU(),
          barcode: row['الباركود'] || row.barcode || Math.floor(6221000000 + Math.random() * 999999).toString(),
          category: row['الفئة'] || row.category || 'other',
          costPrice: parseFloat(row['سعر الشراء'] || row.costPrice) || 0,
          sellPrice: parseFloat(row['سعر البيع'] || row.sellPrice) || 0,
          wholesalePrice: parseFloat(row['سعر الجملة'] || row.wholesalePrice) || 0,
          stock: parseInt(row['الكمية'] || row.stock) || 0,
          minStock: parseInt(row['الحد الأدنى'] || row.minStock) || 5,
          unit: row['الوحدة'] || row.unit || 'قطعة'
        }));

        if (!window.confirm(`تم قراءة ${importedProducts.length} منتج من الملف بنجاح. هل تريد إضافتهم الآن؟`)) {
          return;
        }

        const newProductsList = [...productsList, ...importedProducts];
        setProductsList(newProductsList);
        localStorage.setItem('mizan_products', JSON.stringify(newProductsList));
        alert('تم استيراد المنتجات بنجاح!');
        e.target.value = null; // reset input
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sellPrice) {
      alert('من فضلك املأ الحقول المطلوبة!');
      return;
    }

    const payload = {
      name: formData.name,
      sku: formData.sku || generateSKU(),
      barcode: formData.barcode,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellPrice: parseFloat(formData.sellPrice) || 0,
      wholesalePrice: parseFloat(formData.wholesalePrice) || 0,
      stock: parseInt(formData.stock) || 0,
      minStock: parseInt(formData.minStock) || 0,
      unit: formData.unit,
      colors: formData.colors,
      sizes: formData.sizes,
      dimensions: formData.dimensions,
      expiryDate: formData.expiryDate,
      weightVolume: formData.weightVolume
    };

    // Duplicate detection: same name + same sell price but different SKU
    if (!editingProduct) {
      const dup = productsList.find(
        p => p.name.trim() === formData.name.trim() &&
             parseFloat(p.sellPrice) === parseFloat(formData.sellPrice) &&
             p.sku !== formData.sku
      );
      if (dup && !dupWarning) {
        setDupWarning(dup);
        return; // pause — show warning first
      }
    }

    const saveToBackend = async () => {
      try {
        if (editingProduct) {
          const targetId = editingProduct._id || editingProduct.id;
          await apiService.products.update(targetId, payload);
        } else {
          await apiService.products.create(payload);
        }
        const data = await apiService.products.getAll();
        setProductsList(data);
      } catch (err) {
        console.warn('Failed saving to MongoDB, falling back to local storage:', err.message);
        let updated;
        if (editingProduct) {
          updated = productsList.map(p => (p.id === editingProduct.id || p._id === editingProduct._id) ? { ...p, ...payload } : p);
        } else {
          updated = [...productsList, { id: 'p' + (productsList.length + 1), ...payload }];
        }
        setProductsList(updated);
        localStorage.setItem('mizan_products', JSON.stringify(updated));
      }
      setDupWarning(null);
      setShowModal(false);
    };

    saveToBackend();
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة المنتجات</h1>
          <p style={{ color: 'var(--text-muted)' }}>إضافة وتعديل وحذف منتجات محلك التجاري.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={18} />
            <span>استيراد إكسيل CSV</span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportExcel} 
              style={{ display: 'none' }} 
            />
          </label>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="header-search" style={{ flex: 1, minWidth: '250px' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم المنتج أو الباركود..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-muted)' }}>الفئة:</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '150px', padding: '8px 12px' }}
            >
              {productCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="button" 
            className="btn" 
            style={{ 
              padding: '8px 14px', 
              fontSize: '13px', 
              background: showOnlyDeadStock ? 'var(--warning-glow)' : 'var(--bg-hover)',
              color: showOnlyDeadStock ? 'var(--warning)' : 'var(--text-main)',
              border: showOnlyDeadStock ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)'
            }}
            onClick={() => setShowOnlyDeadStock(!showOnlyDeadStock)}
          >
            <span>تحليل البضائع الراكدة ⚠️</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>الكود (SKU) / الباركود</th>
                <th>اسم المنتج</th>
                <th>الفئة</th>
                <th>سعر الشراء</th>
                <th>سعر التجزئة</th>
                <th>سعر الجملة</th>
                <th>الكمية المتاحة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {p.sku && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-en)', letterSpacing: '0.5px' }}>{p.sku}</span>
                      )}
                      <div className="flex align-center gap-8" style={{ color: 'var(--text-main)', fontWeight: '500' }}>
                        <Barcode size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontFamily: 'var(--font-en)', fontSize: '12px' }}>{p.barcode}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            setSelectedBarcodeProduct(p);
                            setShowBarcodePrintModal(true);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', padding: '2px' }}
                          title="طباعة ملصق الباركود"
                        >
                          <Printer size={13} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
                      {p.colors && <span>الألوان: {p.colors}</span>}
                      {p.sizes && <span> | المقاسات: {p.sizes}</span>}
                      {p.dimensions && <span> | الأبعاد: {p.dimensions}</span>}
                      {p.weightVolume && <span> | الوزن/الحجم: {p.weightVolume}</span>}
                      {p.expiryDate && <span className="text-warning"> | الصلاحية: {p.expiryDate}</span>}
                    </div>
                  </td>
                  <td>{productCategories.find(c => c.id === p.category)?.name || p.category}</td>
                  <td>{p.costPrice} ج.م</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.sellPrice} ...</td>
                  <td>{p.wholesalePrice} ج.م</td>
                  <td>
                    <span className={`badge ${p.stock <= p.minStock ? 'danger' : 'success'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td>{p.unit}</td>
                  <td>
                    <div className="flex align-center justify-between" style={{ width: '80px', margin: '0 auto' }}>
                      <button 
                        onClick={() => openEditModal(p)}
                        style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer' }}
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    لم يتم العثور على أي منتج. اضغط على زر الإضافة لإضافة منتج جديد!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}</h3>
              <X className="modal-close" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave}>
              {/* Duplicate SKU warning banner */}
              {dupWarning && (
                <div style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>⚠️ تحذير: منتج مشابه موجود!</div>
                  <div style={{ color: 'var(--text-main)' }}>
                    يوجد منتج بنفس الاسم والسعر بكود <strong style={{ fontFamily: 'var(--font-en)' }}>{dupWarning.sku || 'غير محدد'}</strong>.
                    هل تريد استخدام نفس الكود لتوحيد المنتج عبر الفروع؟
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" className="btn btn-warning" style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => { setFormData({ ...formData, sku: dupWarning.sku }); setDupWarning(null); }}
                    >استخدم نفس الكود ({dupWarning.sku})</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => setDupWarning(null)}
                    >تجاهل وأكمل</button>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>اسم المنتج *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>كود المنتج (SKU)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      style={{ flex: 1, fontFamily: 'var(--font-en)', fontWeight: '700', letterSpacing: '1px' }}
                      placeholder="MZN-0000"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      onClick={() => setFormData({ ...formData, sku: generateSKU() })}
                    >توليد</button>
                  </div>
                </div>

                <div className="form-group">
                  <label>الباركود</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      name="barcode" 
                      value={formData.barcode} 
                      onChange={handleInputChange} 
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      onClick={() => setFormData({
                        ...formData,
                        barcode: Math.floor(6221000000 + Math.random() * 999999).toString()
                      })}
                    >
                      توليد
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>الفئة</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      name="category" 
                      value={formData.category} 
                      onChange={handleInputChange}
                      style={{ flex: 1 }}
                    >
                      {productCategories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const newCatName = prompt('أدخل اسم الصنف الجديد (مثال: سجاد، سوبرماركت، كوتشيات):');
                        if (newCatName && newCatName.trim()) {
                          const newCatId = 'cat_' + Math.floor(Math.random() * 10000);
                          setProductCategories([
                            ...productCategories,
                            { id: newCatId, name: newCatName.trim() }
                          ]);
                          setFormData({
                            ...formData,
                            category: newCatId
                          });
                        }
                      }}
                    >
                      + صنف جديد
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>سعر الشراء (التكلفة)</label>
                  <input 
                    type="number" 
                    name="costPrice" 
                    value={formData.costPrice} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>سعر التجزئة (البيع للجمهور) *</label>
                  <input 
                    type="number" 
                    name="sellPrice" 
                    value={formData.sellPrice} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>سعر الجملة</label>
                  <input 
                    type="number" 
                    name="wholesalePrice" 
                    value={formData.wholesalePrice} 
                    onChange={handleInputChange} 
                  />
                </div>

                <div className="form-group">
                  <label>وحدة القياس</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange}>
                    <option value="قطعة">قطعة</option>
                    <option value="درزن">درزن</option>
                    <option value="متر">متر</option>
                    <option value="كجم">كجم</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>الكمية الافتتاحية</label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={formData.stock} 
                    onChange={handleInputChange} 
                    disabled={!!editingProduct} // In edit mode, update stock via inventory adjustments
                  />
                </div>

                <div className="form-group">
                  <label>تنبيه الحد الأدنى للمخزون</label>
                  <input 
                    type="number" 
                    name="minStock" 
                    value={formData.minStock} 
                    onChange={handleInputChange} 
                  />
                </div>

                {(storedFeatures.clothingSpecs !== false || storedFeatures.carpetSpecs !== false || storedFeatures.supermarketSpecs !== false) && (
                  <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>تفاصيل ومواصفات إضافية (حسب نوع نشاط المحل)</h4>
                  </div>
                )}

                {storedFeatures.clothingSpecs !== false && (
                  <>
                    <div className="form-group">
                      <label>الألوان المتاحة (للملابس/الأحذية)</label>
                      <input 
                        type="text" 
                        name="colors" 
                        value={formData.colors} 
                        onChange={handleInputChange} 
                        placeholder="مثال: أحمر, أسود, أبيض"
                      />
                    </div>

                    <div className="form-group">
                      <label>المقاسات المتاحة (للملابس/الأحذية)</label>
                      <input 
                        type="text" 
                        name="sizes" 
                        value={formData.sizes} 
                        onChange={handleInputChange} 
                        placeholder="مثال: S, M, L, XL"
                      />
                    </div>
                  </>
                )}

                {storedFeatures.carpetSpecs !== false && (
                  <div className="form-group" style={{ gridColumn: storedFeatures.clothingSpecs === false ? 'span 2' : 'auto' }}>
                    <label>الأبعاد والطول/العرض (للسجاد/الأقمشة)</label>
                    <input 
                      type="text" 
                      name="dimensions" 
                      value={formData.dimensions} 
                      onChange={handleInputChange} 
                      placeholder="مثال: 3x4 متر أو 150 سم"
                    />
                  </div>
                )}

                {storedFeatures.supermarketSpecs !== false && (
                  <>
                    <div className="form-group" style={{ gridColumn: storedFeatures.carpetSpecs === false ? 'span 2' : 'auto' }}>
                      <label>الوزن أو الحجم (للسوبرماركت/المنظفات)</label>
                      <input 
                        type="text" 
                        name="weightVolume" 
                        value={formData.weightVolume} 
                        onChange={handleInputChange} 
                        placeholder="مثال: 1 كجم, 500 مل, 2 لتر"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>تاريخ انتهاء الصلاحية (للمواد الغذائية/مستحضرات التجميل)</label>
                      <input 
                        type="date" 
                        name="expiryDate" 
                        value={formData.expiryDate} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Sticker Print Preview Modal */}
      {showBarcodePrintModal && selectedBarcodeProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '350px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3>طباعة ملصق الباركود (Label)</h3>
              <X className="modal-close" onClick={() => setShowBarcodePrintModal(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {/* Sticker preview box */}
              <div style={{ 
                width: '240px', 
                background: '#fff', 
                color: '#000', 
                padding: '16px', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <strong style={{ fontSize: '15px', fontWeight: 'bold' }}>{selectedBarcodeProduct.name}</strong>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>السعر: {selectedBarcodeProduct.sellPrice} ج.م</span>
                
                {/* Real Barcode Print Pattern */}
                <ReactBarcode value={selectedBarcodeProduct.barcode} width={1.8} height={50} displayValue={true} fontSize={14} background="transparent" />

                {(selectedBarcodeProduct.colors || selectedBarcodeProduct.sizes || selectedBarcodeProduct.dimensions || selectedBarcodeProduct.weightVolume || selectedBarcodeProduct.expiryDate) && (
                  <div style={{ fontSize: '10px', borderTop: '1px dashed #ccc', width: '100%', paddingTop: '6px', marginTop: '4px', textAlign: 'center', color: '#555' }}>
                    {selectedBarcodeProduct.colors && <div>الألوان: {selectedBarcodeProduct.colors}</div>}
                    {selectedBarcodeProduct.sizes && <div style={{ marginTop: '2px' }}>المقاسات: {selectedBarcodeProduct.sizes}</div>}
                    {selectedBarcodeProduct.dimensions && <div style={{ marginTop: '2px' }}>الأبعاد: {selectedBarcodeProduct.dimensions}</div>}
                    {selectedBarcodeProduct.weightVolume && <div style={{ marginTop: '2px' }}>الوزن/الحجم: {selectedBarcodeProduct.weightVolume}</div>}
                    {selectedBarcodeProduct.expiryDate && <div style={{ marginTop: '2px' }}>الصلاحية: {selectedBarcodeProduct.expiryDate}</div>}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                تأكد من شحن طابعة ملصقات الباركود بمقاس 38mm x 25mm وتوصيلها بالمنصة قبل الضغط على طباعة.
              </p>
            </div>

            <div className="modal-footer" style={{ width: '100%' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBarcodePrintModal(false)}>إلغاء</button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                  setShowBarcodePrintModal(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={14} />
                <span>طباعة الملصق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
        title="حذف المنتج"
        message="هل أنت متأكد من حذف هذا المنتج نهائياً؟ لن تتمكن من استعادته لاحقاً."
        confirmText="حذف نهائياً"
        variant="danger"
      />
    </div>
  );
};

export default Products;
