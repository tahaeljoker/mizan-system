import { ZodError } from 'zod';
import * as productService from '../services/product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
  importProductsSchema
} from '../validators/product.validator.js';
import { successResponse, errorResponse } from '../utils/response.js';

const formatZodErrors = (zodError) => {
  return zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

/**
 * Controller: Get Products List (Paginated & Filtered)
 * GET /api/v1/products
 */
export const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return errorResponse(res, error.message || 'Failed to fetch products', statusCode);
  }
};

/**
 * Controller: Get Single Product By ID
 * GET /api/v1/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id, req.user);
    return successResponse(res, { product }, 'Product fetched successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Product not found', statusCode);
  }
};

/**
 * Controller: Get Product By Barcode
 * GET /api/v1/products/barcode/:barcode
 */
export const getProductByBarcode = async (req, res) => {
  try {
    const product = await productService.getProductByBarcode(req.params.barcode, req.user);
    return successResponse(res, { product }, 'Product found', 200);
  } catch (error) {
    const statusCode = error.statusCode || 404;
    return errorResponse(res, error.message || 'Product not found', statusCode);
  }
};

/**
 * Controller: Create Product
 * POST /api/v1/products
 */
export const createProduct = async (req, res) => {
  try {
    const validatedData = createProductSchema.parse(req.body);
    const product = await productService.createProduct(validatedData, req.user, req);
    return successResponse(res, { product }, 'Product created successfully', 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to create product', statusCode);
  }
};

/**
 * Controller: Update Product
 * PUT /api/v1/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    const validatedData = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(req.params.id, validatedData, req.user, req);
    return successResponse(res, { product }, 'Product updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update product', statusCode);
  }
};

/**
 * Controller: Soft Delete Product
 * DELETE /api/v1/products/:id
 */
export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id, req.user, req);
    return successResponse(res, {}, 'Product deleted successfully', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to delete product', statusCode);
  }
};

/**
 * Controller: Bulk Import Products
 * POST /api/v1/products/import
 */
export const importProducts = async (req, res) => {
  try {
    const productsArray = Array.isArray(req.body) ? req.body : req.body?.products;
    if (!productsArray || !Array.isArray(productsArray)) {
      return errorResponse(res, 'Invalid format. Expected an array of products.', 400);
    }

    const summary = await productService.importProducts(productsArray, req.user, req);
    return successResponse(res, { summary }, 'Products import processed', 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Import failed', statusCode);
  }
};

/**
 * Controller: Update Product Stock
 * PATCH /api/v1/products/:id/stock
 */
export const updateStock = async (req, res) => {
  try {
    const validatedData = stockAdjustmentSchema.parse(req.body);
    const result = await productService.updateStock(req.params.id, validatedData, req.user, req);
    return successResponse(res, result, 'Stock updated successfully', 200);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(res, 'Validation failed', 400, formatZodErrors(error));
    }
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to update stock', statusCode);
  }
};
