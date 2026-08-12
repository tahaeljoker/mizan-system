import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Barcode, 
  Image as ImageIcon,
  Printer,
  Upload
} from 'lucide-react';
import { products as initialProducts, categories } from '../data/mockData';
import ConfirmModal from '../components/ConfirmModal';
import ReactBarcode from 'react-barcode';
import Papa from 'papaparse';

import apiService from '../services/api';

const Products = () => {
  const [productsList, setProductsList] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.products.getAll();
        const rawProds = data?.data || data?.products || data;
        const list = Array.isArray(rawProds) ? rawProds : Array.isArray(data) ? data : [];
        setProductsList(list);
      } catch (err) {
        console.warn('Failed fetching products from MongoDB, loading from localStorage:', err.message);
        const localProds = JSON.parse(localStorage.getItem('mizan_products')) || initialProducts;
        setProductsList(Array.isArray(localProds) ? localProds : []);
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

  const safeProductsList = Array.isArray(productsList) ? productsList : [];

  const filteredProducts = safeProductsList.filter((p) => {
    if (!p) return false;
    const q = searchQuery.trim().toLowerCase();
    const nameMatch = p?.name && String(p.name).toLowerCase().includes(q);
    const barcodeMatch = p?.barcode && String(p.barcode).toLowerCase().includes(q);
    const skuMatch = p?.sku && String(p.sku).toLowerCase().includes(q);
    const codeMatch = p?.code && String(p.code).toLowerCase().includes(q);
    const altBarcodesMatch = Array.isArray(p?.alternateBarcodes) && p.alternateBarcodes.some(b => String(b).toLowerCase().includes(q));
    const matchesSearch = !q || nameMatch || barcodeMatch || skuMatch || codeMatch || altBarcodesMatch;
    
    // Dead stock is defined as no sales in the last 60 days
    let matchesDeadStock = true;
    if (showOnlyDeadStock) {
      if (!p.lastSoldDate) {
        matchesDeadStock = true;
      } else {
        const lastSold = new Date(p.lastSoldDate);
        const refDate = new Date('2026-07-12');
        const diffDays = (refDate - lastSold) / (1000 * 60 * 60 * 24);
        matchesDeadStock = diffDays >= 60;
      }
    }

    return matchesCategory && matchesSearch && matchesDeadStock;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      barcode: '',
      category: productCategories[0]?.id || 'dresses',
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
    setDupWarning(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      costPrice: product.costPrice,
      sellPrice: product.sellPrice,
      wholesalePrice: product.wholesalePrice || '',
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
      await apiService.products.delete(confirmState.id);
    } catch (e) {
      console.warn('API delete failed, falling back to local state:', e.message);
    }
    const updated = safeProductsList.filter(p => p._id !== confirmState.id && p.id !== confirmState.id);
    setProductsList(updated);
    localStorage.setItem('mizan_products', JSON.stringify(updated));
    setConfirmState({ isOpen: false, id: null });
  };

  const checkDuplicates = (name, barcode) => {
    const nameMatch = safeProductsList.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase() && p.id !== editingProduct?.id && p._id !== editingProduct?._id);
    const barcodeMatch = barcode ? safeProductsList.find(p => p.barcode === barcode && p.id !== editingProduct?.id && p._id !== editingProduct?._id) : null;
    
    if (barcodeMatch) {
      return `تحذير: البارشود (${barcode}) مستخدم بالفعل لمنتج: "${barcodeMatch.name}"!`;
    }
    if (nameMatch) {
      return `تنبيه: يوجد صنف بنفس الاسم كلياً: "${nameMatch.name}".`;
    }
    return null;
  };

  const handleInputChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);
    
    if (field === 'name' || field === 'barcode') {
      const warning = checkDuplicates(
        field === 'name' ? value : formData.name,
        field === 'barcode' ? value : formData.barcode
      );
      setDupWarning(warning);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sellPrice) return;

    const payload = {
      name: formData.name,
      barcode: formData.barcode || '622' + Math.floor(100000000 + Math.random() * 900000000),
      category: formData.category,
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      wholesalePrice: Number(formData.wholesalePrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      unit: formData.unit,
      colors: formData.colors,
      sizes: formData.sizes,
      dimensions: formData.dimensions,
      expiryDate: formData.expiryDate,
      weightVolume: formData.weightVolume
    };

    try {
      if (editingProduct) {
        await apiService.products.update(editingProduct._id || editingProduct.id, payload);
      } else {
        await apiService.products.create(payload);
      }
    } catch (err) {
      console.warn('API save failed, falling back to local state:', err.message);
    }

    let updated = [];
    if (editingProduct) {
      updated = safeProductsList.map(p => (p._id === editingProduct._id || p.id === editingProduct.id) ? { ...p, ...payload } : p);
    } else {
      updated = [{ _id: 'p' + Date.now(), ...payload }, ...safeProductsList];
    }
    setProductsList(updated);
    localStorage.setItem('mizan_products', JSON.stringify(updated));
    setShowModal(false);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const imported = results.data.map((row, index) => ({
          _id: 'imp_' + Date.now() + '_' + index,
          name: row['اسم المنتج'] || row['Name'] || 'منتج مستورد',
          barcode: row['الباركود'] || row['Barcode'] || ('622' + Math.floor(100000000 + Math.random() * 900000000)),
          category: row['الفئة'] || row['Category'] || 'عام',
          costPrice: Number(row['سعر التكلفة'] || row['Cost']) || 0,
          sellPrice: Number(row['سعر البيع'] || row['Price']) || 0,
          wholesalePrice: Number(row['سعر الجملة'] || row['Wholesale']) || 0,
          stock: Number(row['الكمية'] || row['Stock']) || 0,
          minStock: Number(row['حد الأمان'] || row['MinStock']) || 5,
          unit: row['الوحدة'] || row['Unit'] || 'قطعة'
        }));

        try {
          await apiService.products.bulkImport(imported);
        } catch (err) {
          console.warn('API Bulk import failed, adding locally:', err.message);
        }

        const newProductsList = [...imported, ...safeProductsList];
        setProductsList(newProductsList);
        localStorage.setItem('mizan_products', JSON.stringify(newProductsList));
        alert(`تم استيراد ${imported.length} صنف جديد بنجاح وتحديث القاعدة.`);
      }
    });
  };

  const handlePrintBarcode = (product) => {
    setSelectedBarcodeProduct(product);
    setShowBarcodePrintModal(true);
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-24">
        <div>
          <h1 style={{ fontSize: '28px' }}>إدارة المنتجات والأصناف</h1>
          <p style={{ color: 'var(--text-muted)' }}>إضافة منتجات، طباعة ملصقات البارشود، والمواصفات الخاصة بكل نشاط.</p>
        </div>
        <div className="flex gap-12">
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} />
            <span>استيراد شيت CSV / Excel</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Dead Stock & Filter Bar */}
      <div className="card mb-24" style={{ padding: '16px' }}>
        <div className="flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="header-search" style={{ width: '320px' }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="البحث باسم المنتج أو رقم الباركود..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex align-center gap-16">
            <button 
              className={`btn ${showOnlyDeadStock ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '13px', background: showOnlyDeadStock ? 'var(--danger)' : '', borderColor: showOnlyDeadStock ? 'var(--danger)' : '' }}
              onClick={() => setShowOnlyDeadStock(!showOnlyDeadStock)}
            >
              <span>{showOnlyDeadStock ? 'عرض جميع المنتجات' : 'تصفية الراكد (عديم الحركة 60 يوم)'}</span>
            </button>

            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '180px', padding: '8px 12px' }}
            >
              <option value="all">جميع الفئات</option>
              {productCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>البارشود</th>
                <th>اسم المنتج</th>
                <th>الفئة</th>
                <th>التكلفة</th>
                <th>سعر البيع</th>
                <th>الكمية المتاحة</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p._id || p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.barcode}</td>
                      <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                      <td>
                        <span className="badge info">{p.category}</span>
                      </td>
                      <td>{p.costPrice?.toLocaleString()} ج.م</td>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{p.sellPrice?.toLocaleString()} ج.م</td>
                      <td style={{ fontWeight: 'bold' }}>{p.stock} {p.unit || 'قطعة'}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge danger">مخزون منخفض</span>
                        ) : (
                          <span className="badge success">متوفر</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="action-btn" title="طباعة باركود" onClick={() => handlePrintBarcode(p)}>
                            <Printer size={16} />
                          </button>
                          <button className="action-btn text-primary" title="تعديل" onClick={() => openEditModal(p)}>
                            <Edit size={16} />
                          </button>
                          <button className="action-btn text-danger" title="حذف" onClick={() => handleDelete(p._id || p.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    لا توجد منتجات مطابقة لعملية البحث الحالية.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            direction: 'rtl'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة صنف جديد كلياً'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>

            {dupWarning && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px' }}>
                {dupWarning}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="grid-cols-2 mb-16" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label>اسم المنتج / الصنف *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="مثال: فستان سواريه مطرز"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>البارشود</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="اتركه فارغاً للتوليد التلقائي"
                  />
                </div>
              </div>

              <div className="grid-cols-2 mb-16" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label>سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>سعر البيع للجمهور (ج.م) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sellPrice}
                    onChange={(e) => handleInputChange('sellPrice', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid-cols-2 mb-16" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label>الكمية المتاحة بالمخزن *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>حد الأمان (الحد الأدنى)</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange('minStock', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-12 mt-24">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary">حفظ المنتج</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {showBarcodePrintModal && selectedBarcodeProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'var(--font-ar)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            direction: 'rtl',
            textAlign: 'center'
          }}>
            <div className="flex justify-between align-center mb-16">
              <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>معاينة وطباعة ملصق البارشود</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowBarcodePrintModal(false)} />
            </div>

            <div style={{ padding: '20px', border: '1px dashed var(--border)', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{selectedBarcodeProduct.name}</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)', marginBottom: '8px' }}>
                {selectedBarcodeProduct.sellPrice} ج.م
              </div>
              <ReactBarcode value={selectedBarcodeProduct.barcode || '62210001111'} width={1.8} height={50} fontSize={12} />
            </div>

            <div className="flex justify-center gap-12">
              <button className="btn btn-secondary" onClick={() => setShowBarcodePrintModal(false)}>إلغاء</button>
              <button className="btn btn-primary" onClick={triggerPrintWindow}>
                <Printer size={16} />
                <span>طباعة الملصق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="تأكيد حذف المنتج"
        message="هل أنت تأكد من حذف هذا المنتج نهائياً من القائمة؟"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default Products;
