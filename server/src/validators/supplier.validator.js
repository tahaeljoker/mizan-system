import { z } from 'zod';

export const createSupplierSchema = z.object({
  company: z.string({ required_error: 'اسم الشركة/المورد مطلوب' }).min(1, 'اسم الشركة لا يمكن أن يكون فارغاً'),
  contactPerson: z.string().optional().default(''),
  phone: z.string({ required_error: 'رقم الهاتف مطلوب' }).min(1, 'رقم الهاتف مطلوب'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  taxNumber: z.string().optional().default(''),
  address: z.string().optional().default(''),
  openingBalance: z.coerce.number().optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional()
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const supplierSettleSchema = z.object({
  amount: z.coerce.number({ required_error: 'مبلغ الدفع/التسوية مطلوب' }).min(0.01, 'المبلغ يجب أن يكون أكبر من 0'),
  type: z.enum(['PAYMENT', 'ADJUSTMENT', 'REFUND']).optional().default('PAYMENT'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default('')
});
