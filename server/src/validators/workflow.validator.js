import { z } from 'zod';

export const createNotificationSchema = z.object({
  title: z.string({ required_error: 'عنوان الإشعار مطلوب' }).min(1, 'العنوان مطلوب'),
  message: z.string({ required_error: 'نص الإشعار مطلوب' }).min(1, 'نص الإشعار مطلوب'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM', 'FINANCE', 'PURCHASE', 'SALE', 'INVENTORY', 'SHIFT']).optional().default('INFO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  userId: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  action: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().default({})
});

export const createApprovalSchema = z.object({
  type: z.enum([
    'PURCHASE_ORDER',
    'EXPENSE',
    'STOCK_ADJUSTMENT',
    'BANK_TRANSFER',
    'MANUAL_JOURNAL',
    'PRICE_CHANGE',
    'DISCOUNT_OVERRIDE',
    'DELETE_PRODUCT',
    'DELETE_CUSTOMER',
    'DELETE_SUPPLIER',
    'DELETE_EXPENSE'
  ], { required_error: 'نوع الموافقة مطلوب' }),
  entityId: z.string({ required_error: 'معرف السجل مطلوب' }),
  reason: z.string().optional().default(''),
  metadata: z.record(z.any()).optional().default({})
});

export const processApprovalSchema = z.object({
  comments: z.string().optional().default('')
});

export const runJobSchema = z.object({
  jobName: z.enum([
    'low_stock_scan',
    'unread_notification_cleanup',
    'daily_reports',
    'dashboard_cache_refresh',
    'old_logs_cleanup',
    'daily_backup_trigger'
  ], { required_error: 'اسم المهمة مطلوب' })
});
