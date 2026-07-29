import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string({ required_error: 'معرف المورد مطلوب' }),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    quantity: z.coerce.number({ required_error: 'الكمية مطلوبة' }).min(1, 'الكمية يجب أن تكون 1 على الأقل'),
    costPrice: z.coerce.number({ required_error: 'سعر التكلفة مطلوب' }).min(0, 'سعر التكلفة لا يمكن أن يكون سالباً')
  }), { required_error: 'قائمة أصناف أمر الشراء مطلوبة' }).min(1, 'يجب تحديد صنف واحد على الأقل')
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const receivePurchaseOrderSchema = z.object({
  notes: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    receivedQuantity: z.coerce.number().min(0, 'الكمية المستلمة لا يمكن أن تكون سالبة')
  })).optional()
});
