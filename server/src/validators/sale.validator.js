import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    name: z.string().optional(),
    unit: z.string().optional().default('قطعة'),
    quantity: z.coerce.number({ required_error: 'الكمية مطلوبة' }).min(0.001, 'الكمية يجب أن تكون أكبر من 0'),
    unitPrice: z.coerce.number({ required_error: 'سعر الوحدة مطلوب' }).min(0, 'السعر لا يمكن أن يكون سالباً'),
    discount: z.coerce.number().min(0).optional().default(0)
  }), { required_error: 'قائمة الأصناف مطلوبة' }).min(1, 'يجب إضافة صنف واحد على الأقل للمبيعات'),
  payments: z.array(z.object({
    method: z.enum(['CASH', 'CARD', 'INSTAPAY', 'DEBT', 'CREDIT'], { required_error: 'طريقة الدفع غير صحيحة' }),
    amount: z.coerce.number({ required_error: 'مبلغ الدفع مطلوب' }).min(0, 'المبلغ لا يمكن أن يكون سالباً'),
    reference: z.string().optional().default('')
  })).optional().default([]),
  discount: z.coerce.number().min(0).optional().default(0),
  tax: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional().default('')
});

export const holdSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    name: z.string().optional(),
    unit: z.string().optional().default('قطعة'),
    quantity: z.coerce.number().min(0.001),
    unitPrice: z.coerce.number().min(0),
    discount: z.coerce.number().min(0).optional().default(0)
  })).optional().default([]),
  notes: z.string().optional().default('')
});

export const refundSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string({ required_error: 'معرف المنتج مطلوب' }),
    quantity: z.coerce.number().min(0.001, 'الكمية المسترجعة يجب أن تكون أكبر من 0')
  }), { required_error: 'قائمة المنتجات المسترجعة مطلوبة' }).min(1, 'يجب تحديد منتج واحد على الأقل لاسترجاعه'),
  refundMethod: z.enum(['CASH', 'CARD', 'INSTAPAY', 'CUSTOMER_BALANCE']).optional().default('CASH'),
  reason: z.string().optional().default('')
});
