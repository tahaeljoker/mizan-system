import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().optional(),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    systemQuantity: z.coerce.number().optional()
  })).optional()
});

export const updateSessionSchema = createSessionSchema.partial();

export const blindCountSchema = z.object({
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    countedQuantity: z.coerce.number({ required_error: 'الكمية المحسوبة مطلوبة' }).min(0, 'الكمية لا يمكن أن تكون سالبة')
  }), { required_error: 'قائمة الجرد مطلوبة' }).min(1, 'يجب تقديم منتج واحد على الأقل')
});

export const managerReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], { required_error: 'إجراء مراجعة المدير مطلوب' }),
  notes: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string(),
    status: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().optional()
  })).optional()
});

export const manualAdjustmentSchema = z.object({
  productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
  branchId: z.string().optional().nullable(),
  quantity: z.coerce.number({ required_error: 'الكمية مطلوبة' }),
  type: z.enum(['SALE', 'RETURN', 'PURCHASE', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT', 'STOCKTAKE'], {
    required_error: 'نوع العملية غير صحيح'
  }),
  reason: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const createTransferSchema = z.object({
  fromBranchId: z.string({ required_error: 'فرع المصدر مطلوب' }),
  toBranchId: z.string({ required_error: 'فرع الوجهة مطلوب' }),
  notes: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    quantity: z.coerce.number({ required_error: 'الكمية مطلوبة' }).min(1, 'الكمية يجب أن تكون 1 على الأقل')
  }), { required_error: 'قائمة المنتجات المحولة مطلوبة' }).min(1, 'يجب تحديد منتج واحد على الأقل للتحويل')
});

export const receiveTransferSchema = z.object({
  notes: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string(),
    receivedQuantity: z.coerce.number().min(0)
  })).optional()
});
