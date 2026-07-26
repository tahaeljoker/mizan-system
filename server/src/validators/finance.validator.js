import { z } from 'zod';

export const expenseCategorySchema = z.object({
  name: z.string({ required_error: 'اسم الفئة مطلوب' }).min(1, 'اسم الفئة مطلوب'),
  description: z.string().optional().default(''),
  isDefault: z.boolean().optional().default(false)
});

export const expenseSchema = z.object({
  categoryId: z.string({ required_error: 'معرف فئة المصروف مطلوب' }),
  amount: z.coerce.number({ required_error: 'مبلغ المصروف مطلوب' }).gt(0, 'يجب أن يكون المبلغ أكبر من صفر'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY']).optional().default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  reference: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  expenseDate: z.string().optional()
});

export const bankAccountSchema = z.object({
  bankName: z.string({ required_error: 'اسم البنك مطلوب' }).min(1, 'اسم البنك مطلوب'),
  accountName: z.string({ required_error: 'اسم الحساب مطلوب' }).min(1, 'اسم الحساب مطلوب'),
  accountNumber: z.string({ required_error: 'رقم الحساب مطلوب' }).min(1, 'رقم الحساب مطلوب'),
  iban: z.string().optional().default(''),
  swiftCode: z.string().optional().default(''),
  balance: z.coerce.number().optional().default(0),
  currency: z.string().optional().default('EGP'),
  branchId: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false)
});

export const cashMovementSchema = z.object({
  amount: z.coerce.number({ required_error: 'المبلغ مطلوب' }).gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  branchId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY']).optional().default('CASH'),
  notes: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const treasuryTransferSchema = z.object({
  fromType: z.enum(['CASH', 'BANK'], { required_error: 'نوع المصدر مطلوب' }),
  fromBankAccountId: z.string().optional().nullable(),
  toType: z.enum(['CASH', 'BANK'], { required_error: 'نوع الوجهة مطلوب' }),
  toBankAccountId: z.string().optional().nullable(),
  amount: z.coerce.number({ required_error: 'المبلغ مطلوب' }).gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  notes: z.string().optional().default('')
});

export const bankDepositWithdrawSchema = z.object({
  amount: z.coerce.number({ required_error: 'المبلغ مطلوب' }).gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  notes: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const customerPaymentSchema = z.object({
  customerId: z.string({ required_error: 'معرف العميل مطلوب' }),
  amount: z.coerce.number({ required_error: 'مبلغ الدفعة مطلوب' }).gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY']).optional().default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const supplierPaymentSchema = z.object({
  supplierId: z.string({ required_error: 'معرف المورد مطلوب' }),
  amount: z.coerce.number({ required_error: 'مبلغ الدفعة مطلوب' }).gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'INSTAPAY']).optional().default('CASH'),
  bankAccountId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional().default(''),
  reference: z.string().optional().default('')
});

export const journalEntrySchema = z.object({
  description: z.string({ required_error: 'وصف القيد مطلوب' }),
  reference: z.string().optional().default(''),
  items: z.array(z.object({
    accountCode: z.string({ required_error: 'كود الحساب مطلوب' }),
    accountName: z.string({ required_error: 'اسم الحساب مطلوب' }),
    debit: z.coerce.number().optional().default(0),
    credit: z.coerce.number().optional().default(0),
    memo: z.string().optional().default('')
  }), { required_error: 'بنود القيد مطلوبة' }).min(2, 'القيد المحاسبي يجب أن يحتوي على بندين على الأقل')
});
