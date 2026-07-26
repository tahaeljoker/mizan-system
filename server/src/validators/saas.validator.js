import { z } from 'zod';

export const companyRegisterSchema = z.object({
  companyName: z.string({ required_error: 'اسم الشركة مطلوب' }).min(2, 'اسم الشركة قصير جداً'),
  ownerName: z.string({ required_error: 'اسم المالك مطلوب' }).min(2, 'اسم المالك قصير جداً'),
  phone: z.string({ required_error: 'رقم الهاتف مطلوب' }),
  email: z.string({ required_error: 'البريد الإلكتروني مطلوب' }).email('بريد إلكتروني غير صالح'),
  password: z.string({ required_error: 'كلمة المرور مطلوبة' }).min(6, 'كلمة المرور 6 أحرف على الأقل')
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  maxUsers: z.number().min(1),
  maxBranches: z.number().min(1),
  maxProducts: z.number().min(1),
  maxStorageMb: z.number().min(100),
  modules: z.array(z.string()).optional().default([]),
  trialDays: z.number().optional().default(14)
});

export const updateCompanyStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'expired']),
  plan: z.string().optional()
});

export const createSupportTicketSchema = z.object({
  subject: z.string({ required_error: 'موضوع التذكرة مطلوب' }).min(3),
  message: z.string({ required_error: 'نص الرسالة مطلوب' }).min(5),
  category: z.string().optional().default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM')
});

export const replySupportTicketSchema = z.object({
  message: z.string({ required_error: 'نص الرد مطلوب' }).min(1)
});

export const whiteLabelConfigSchema = z.object({
  logoUrl: z.string().optional().default(''),
  primaryColor: z.string().optional().default('#4f46e5'),
  secondaryColor: z.string().optional().default('#7c3aed'),
  systemName: z.string().optional().default('مِدار ERP'),
  invoiceFooter: z.string().optional().default('شكراً لتسوقكم معنا!'),
  customDomain: { type: String, default: '' }
});
