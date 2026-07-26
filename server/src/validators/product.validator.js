import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string({ required_error: 'اسم المنتج مطلوب' }).min(1, 'اسم المنتج لا يمكن أن يكون فارغاً'),
  barcode: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  alternateBarcodes: z.array(z.string()).optional(),
  category: z.string({ required_error: 'الفئة مطلوبة' }).min(1, 'الفئة مطلوبة'),
  brand: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'سعر التكلفة يجب أن يكون 0 أو أكثر').optional(),
  sellPrice: z.coerce.number().min(0, 'سعر البيع يجب أن يكون 0 أو أكثر'),
  wholesalePrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().optional(),
  minStock: z.coerce.number().min(0).optional(),
  minimumStock: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  image: z.string().nullable().optional(),
  branchId: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'discontinued', 'deleted']).optional()
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number({ required_error: 'الكمية مطلوبة' }),
  type: z.enum(['SALE', 'RETURN', 'PURCHASE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCKTAKE'], {
    required_error: 'نوع عملية المخزون غير صحيح'
  }),
  reason: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const importProductsSchema = z.object({
  products: z.array(createProductSchema, { required_error: 'قائمة المنتجات مطلوبة للاستيراد' })
});
