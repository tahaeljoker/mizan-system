import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import InventoryTransaction from '../../models/InventoryTransaction.js';
import ActivityLog from '../../models/ActivityLog.js';

/**
 * Service: Get Paginated & Filtered Products List
 */
export const getProducts = async (queryParams, user) => {
  const {
    search,
    barcode,
    sku,
    category,
    brand,
    branch,
    status,
    lowStock,
    outOfStock,
    page = 1,
    limit = 20,
    sort = '-createdAt'
  } = queryParams;

  const orgId = user.orgId;
  const filter = {
    orgId,
    isDeleted: { $ne: true }
  };

  // Text search on name, sku, barcode
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { sku: searchRegex },
      { barcode: searchRegex },
      { alternateBarcodes: searchRegex }
    ];
  }

  // Barcode specific search
  if (barcode && barcode.trim()) {
    const barcodeRegex = new RegExp(barcode.trim(), 'i');
    filter.$or = [
      { barcode: barcodeRegex },
      { alternateBarcodes: barcodeRegex }
    ];
  }

  // SKU specific search
  if (sku && sku.trim()) {
    filter.sku = new RegExp(sku.trim(), 'i');
  }

  // Category filter
  if (category && category.trim()) {
    filter.category = category.trim();
  }

  // Brand filter
  if (brand && brand.trim()) {
    filter.brand = brand.trim();
  }

  // Branch filter
  if (branch && branch.trim() && mongoose.Types.ObjectId.isValid(branch.trim())) {
    filter.branchId = branch.trim();
  }

  // Status filter
  if (status && status.trim()) {
    filter.status = status.trim();
  }

  // Out of stock filter
  if (outOfStock === 'true' || outOfStock === true) {
    filter.stock = { $lte: 0 };
  }

  // Low stock filter
  if (lowStock === 'true' || lowStock === true) {
    filter.$expr = { $lte: ['$stock', '$minStock'] };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [products, totalItems] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  return {
    data: products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalItems,
      totalPages
    }
  };
};

/**
 * Service: Get Single Product By ID
 */
export const getProductById = async (id, user) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid product ID format');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findOne({
    _id: id,
    orgId: user.orgId,
    isDeleted: { $ne: true }
  }).lean();

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Service: Get Product By Barcode
 */
export const getProductByBarcode = async (barcode, user) => {
  if (!barcode || !barcode.trim()) {
    const error = new Error('Barcode parameter is required');
    error.statusCode = 400;
    throw error;
  }

  const searchBarcode = barcode.trim();
  const product = await Product.findOne({
    orgId: user.orgId,
    isDeleted: { $ne: true },
    $or: [
      { barcode: searchBarcode },
      { alternateBarcodes: searchBarcode }
    ]
  }).lean();

  if (!product) {
    const error = new Error(`Product with barcode '${searchBarcode}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/**
 * Service: Create New Product
 */
export const createProduct = async (data, user, req = {}) => {
  const orgId = user.orgId;

  // Auto-generate SKU if not provided
  const sku = (data.sku && data.sku.trim())
    ? data.sku.trim()
    : `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  // Auto-generate Barcode if not provided
  const barcode = (data.barcode && data.barcode.trim())
    ? data.barcode.trim()
    : `${Date.now()}`;

  // Unique SKU check within org
  const existingSku = await Product.findOne({ orgId, sku, isDeleted: { $ne: true } });
  if (existingSku) {
    const error = new Error(`Product with SKU '${sku}' already exists`);
    error.statusCode = 400;
    throw error;
  }

  // Unique Barcode check within org
  const existingBarcode = await Product.findOne({ orgId, barcode, isDeleted: { $ne: true } });
  if (existingBarcode) {
    const error = new Error(`Product with Barcode '${barcode}' already exists`);
    error.statusCode = 400;
    throw error;
  }

  const minStock = data.minimumStock !== undefined ? data.minimumStock : (data.minStock || 5);

  const productPayload = {
    costPrice: 0,
    wholesalePrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'قطعة',
    brand: '',
    ...data,
    orgId,
    sku,
    barcode,
    minStock,
    createdBy: user._id,
    status: data.status || 'active'
  };

  const product = await Product.create(productPayload);

  // Log Activity
  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    details: { name: product.name, barcode: product.barcode, sku: product.sku },
    ipAddress: req.ip || ''
  });

  return product;
};

/**
 * Service: Update Existing Product
 */
export const updateProduct = async (id, data, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid product ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const product = await Product.findOne({ _id: id, orgId, isDeleted: { $ne: true } });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // Check unique SKU if changed
  if (data.sku && data.sku.trim() && data.sku.trim() !== product.sku) {
    const existingSku = await Product.findOne({
      _id: { $ne: id },
      orgId,
      sku: data.sku.trim(),
      isDeleted: { $ne: true }
    });
    if (existingSku) {
      const error = new Error(`Product with SKU '${data.sku.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
    product.sku = data.sku.trim();
  }

  // Check unique Barcode if changed
  if (data.barcode && data.barcode.trim() && data.barcode.trim() !== product.barcode) {
    const existingBarcode = await Product.findOne({
      _id: { $ne: id },
      orgId,
      barcode: data.barcode.trim(),
      isDeleted: { $ne: true }
    });
    if (existingBarcode) {
      const error = new Error(`Product with Barcode '${data.barcode.trim()}' already exists`);
      error.statusCode = 400;
      throw error;
    }
    product.barcode = data.barcode.trim();
  }

  // Update fields
  if (data.name !== undefined) product.name = data.name;
  if (data.category !== undefined) product.category = data.category;
  if (data.brand !== undefined) product.brand = data.brand;
  if (data.costPrice !== undefined) product.costPrice = data.costPrice;
  if (data.sellPrice !== undefined) product.sellPrice = data.sellPrice;
  if (data.wholesalePrice !== undefined) product.wholesalePrice = data.wholesalePrice;
  if (data.stock !== undefined) product.stock = data.stock;
  if (data.minStock !== undefined) product.minStock = data.minStock;
  if (data.minimumStock !== undefined) product.minStock = data.minimumStock;
  if (data.unit !== undefined) product.unit = data.unit;
  if (data.image !== undefined) product.image = data.image;
  if (data.branchId !== undefined) product.branchId = data.branchId;
  if (data.status !== undefined) product.status = data.status;
  if (data.alternateBarcodes !== undefined) product.alternateBarcodes = data.alternateBarcodes;

  product.updatedBy = user._id;
  await product.save();

  // Log Activity
  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'UPDATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    details: { name: product.name, barcode: product.barcode },
    ipAddress: req.ip || ''
  });

  return product;
};

/**
 * Service: Soft Delete Product
 */
export const deleteProduct = async (id, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid product ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const product = await Product.findOneAndUpdate(
    { _id: id, orgId, isDeleted: { $ne: true } },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user._id,
        status: 'deleted'
      }
    },
    { new: true }
  );

  if (!product) {
    const error = new Error('Product not found or already deleted');
    error.statusCode = 404;
    throw error;
  }

  // Log Activity
  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'DELETE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    details: { name: product.name, barcode: product.barcode },
    ipAddress: req.ip || ''
  });

  return true;
};

/**
 * Service: Bulk Import Products
 */
export const importProducts = async (productsList, user, req = {}) => {
  const orgId = user.orgId;
  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < productsList.length; i++) {
    const item = productsList[i];
    try {
      if (!item.name || !item.name.trim() || !item.category || item.sellPrice === undefined) {
        skipped++;
        errors.push({ row: i + 1, item: item.name || `Row ${i + 1}`, error: 'Missing required fields (name, category, sellPrice)' });
        continue;
      }

      const sku = (item.sku && item.sku.trim())
        ? item.sku.trim()
        : `SKU-${Date.now().toString().slice(-6)}-${i}`;

      const barcode = (item.barcode && item.barcode.trim())
        ? item.barcode.trim()
        : `${Date.now()}${i}`;

      // Check unique SKU & Barcode within org
      const existing = await Product.findOne({
        orgId,
        isDeleted: { $ne: true },
        $or: [{ sku }, { barcode }]
      });

      if (existing) {
        skipped++;
        errors.push({ row: i + 1, item: item.name, error: `Duplicate SKU '${sku}' or Barcode '${barcode}'` });
        continue;
      }

      await Product.create({
        ...item,
        orgId,
        sku,
        barcode,
        createdBy: user._id,
        status: 'active'
      });

      imported++;
    } catch (err) {
      skipped++;
      errors.push({ row: i + 1, item: item.name || `Row ${i + 1}`, error: err.message });
    }
  }

  // Log Activity
  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'IMPORT_PRODUCTS',
    entity: 'Product',
    details: { total: productsList.length, imported, skipped },
    ipAddress: req.ip || ''
  });

  return {
    imported,
    skipped,
    total: productsList.length,
    errors
  };
};

/**
 * Service: Atomically Update Product Stock
 */
export const updateStock = async (id, { quantity, type, reason, reference }, user, req = {}) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid product ID format');
    error.statusCode = 400;
    throw error;
  }

  const orgId = user.orgId;
  const product = await Product.findOne({ _id: id, orgId, isDeleted: { $ne: true } });

  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  let quantityChange = 0;
  const qty = Number(quantity);

  switch (type) {
    case 'PURCHASE':
    case 'RETURN':
    case 'TRANSFER_IN':
      quantityChange = Math.abs(qty);
      break;
    case 'SALE':
    case 'TRANSFER_OUT':
      quantityChange = -Math.abs(qty);
      break;
    case 'ADJUSTMENT':
      quantityChange = qty;
      break;
    case 'STOCKTAKE':
      quantityChange = qty - product.stock;
      break;
    default:
      quantityChange = qty;
      break;
  }

  const previousStock = product.stock;
  const newStock = previousStock + quantityChange;

  if (newStock < 0) {
    const error = new Error(`Stock cannot be negative. Current stock is ${previousStock}, change requested is ${quantityChange}`);
    error.statusCode = 400;
    throw error;
  }

  product.stock = newStock;
  product.updatedBy = user._id;
  await product.save();

  // Create Inventory Transaction
  const transaction = await InventoryTransaction.create({
    orgId,
    productId: product._id,
    type,
    quantity: quantityChange,
    previousStock,
    newStock,
    reason: reason || '',
    reference: reference || '',
    createdBy: user._id
  });

  // Log Activity
  await ActivityLog.create({
    orgId,
    userId: user._id,
    action: 'UPDATE_STOCK',
    entity: 'Product',
    entityId: product._id,
    details: { productName: product.name, type, previousStock, newStock, quantityChange },
    ipAddress: req.ip || ''
  });

  return {
    product,
    transaction
  };
};
