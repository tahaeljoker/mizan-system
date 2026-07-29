import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string({ required_error: 'اسم العميل مطلوب' }).min(1, 'اسم العميل لا يمكن أن يكون فارغاً'),
  phone: z.string({ required_error: 'رقم الهاتف مطلوب' }).min(1, 'رقم الهاتف لا يمكن أن يكون فارغاً'),
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة').optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  nationalId: z.string().optional().or(z.literal('')),
  address: z.string().optional().default(''),
  creditLimit: z.coerce.number().min(0, 'الحد الائتماني يجب أن يكون 0 أو أكثر').optional(),
  openingBalance: z.coerce.number().optional(),
  loyaltyPoints: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'deleted']).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerSettleSchema = z.object({
  amount: z.coerce.number({ required_error: 'مبلغ التسوية/السداد مطلوب' }).min(0.01, 'المبلغ يجب أن يكون أكبر من 0'),
  type: z.enum(['PAYMENT', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT']).optional().default('PAYMENT'),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export const updateLoyaltySchema = z.object({
  points: z.coerce.number({ required_error: 'نقاط الولاء مطلوبة' }),
  type: z.enum(['EARN', 'REDEEM', 'ADJUSTMENT'], { required_error: 'نوع عملية النقاط مطلوب' }),
  description: z.string().optional().default('')
});
