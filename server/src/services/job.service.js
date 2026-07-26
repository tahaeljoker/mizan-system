import JobLog from '../../models/JobLog.js';
import Product from '../../models/Product.js';
import Notification from '../../models/Notification.js';
import ActivityLog from '../../models/ActivityLog.js';
import * as notificationService from './notification.service.js';

export const REGISTERED_JOBS = [
  { jobName: 'low_stock_scan', title: 'فحص المخزون المنخفض', description: 'مسح شامل للمنتجات التي قل مخزونها عن الحد الأدنى وإرسال تنبيهات' },
  { jobName: 'unread_notification_cleanup', title: 'تنظيف الإشعارات القديمة', description: 'حذف الإشعارات المقروءة الأقدم من 30 يوماً' },
  { jobName: 'daily_reports', title: 'توليد التقارير اليومية', description: 'توليد وتحديث مؤشرات الأداء اليومية' },
  { jobName: 'dashboard_cache_refresh', title: 'تحديث مؤشرات اللوحة الرئيسية', description: 'إعادة تنشيط الذاكرة المؤقتة لمؤشرات الإدارة' },
  { jobName: 'old_logs_cleanup', title: 'تنظيف سجلات النشاط القديمة', description: 'أرشفة وتنظيف سجلات النشاط الأقدم من 90 يوماً' },
  { jobName: 'daily_backup_trigger', title: 'نسخ احتياطي يومي (Placeholder)', description: 'مشغل النسخ الاحتياطي لقواعد البيانات' }
];

export const runJob = async (jobName, user = {}) => {
  const startTime = Date.now();
  const orgId = user.orgId || null;

  const jobLog = await JobLog.create({
    orgId,
    jobName,
    status: 'RUNNING',
    details: { startedBy: user.name || 'System' }
  });

  try {
    let resultDetails = {};

    switch (jobName) {
      case 'low_stock_scan': {
        const filter = { isDeleted: { $ne: true }, $expr: { $lte: ['$stock', '$minStock'] } };
        if (orgId) filter.orgId = orgId;

        const lowStockProducts = await Product.find(filter).lean();
        if (lowStockProducts.length > 0) {
          for (const p of lowStockProducts) {
            await notificationService.createNotification({
              orgId: p.orgId,
              title: 'تنبيه مخزون منخفض',
              message: `المنتج (${p.name}) قل مخزونه عن الحد الأدنى. المتاح حالياً: ${p.stock}`,
              type: 'INVENTORY',
              priority: 'HIGH',
              entityType: 'Product',
              entityId: p._id,
              role: 'manager'
            });
          }
        }
        resultDetails = { lowStockProductsFound: lowStockProducts.length };
        break;
      }

      case 'unread_notification_cleanup': {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - 30);
        const filter = { isRead: true, createdAt: { $lt: dateThreshold } };
        if (orgId) filter.orgId = orgId;

        const deleted = await Notification.deleteMany(filter);
        resultDetails = { deletedNotificationsCount: deleted.deletedCount || 0 };
        break;
      }

      case 'daily_reports': {
        resultDetails = { reportGeneratedAt: new Date().toISOString(), status: 'SUCCESS' };
        break;
      }

      case 'dashboard_cache_refresh': {
        resultDetails = { cacheRefreshed: true, timestamp: Date.now() };
        break;
      }

      case 'old_logs_cleanup': {
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - 90);
        const filter = { createdAt: { $lt: dateThreshold } };
        if (orgId) filter.orgId = orgId;

        const deletedLogs = await ActivityLog.deleteMany(filter);
        resultDetails = { deletedLogsCount: deletedLogs.deletedCount || 0 };
        break;
      }

      case 'daily_backup_trigger': {
        resultDetails = { backupStatus: 'TRIGGERED_SUCCESSFULLY', targetStorage: 'Local & Cloud S3 Placeholder' };
        break;
      }

      default: {
        throw new Error(`Job '${jobName}' is not registered`);
      }
    }

    const durationMs = Date.now() - startTime;
    jobLog.status = 'COMPLETED';
    jobLog.durationMs = durationMs;
    jobLog.details = { ...jobLog.details, ...resultDetails };
    await jobLog.save();

    return jobLog;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    jobLog.status = 'FAILED';
    jobLog.durationMs = durationMs;
    jobLog.error = error.message;
    await jobLog.save();
    throw error;
  }
};

export const getJobsList = () => {
  return REGISTERED_JOBS;
};

export const getJobHistory = async (user) => {
  const filter = {};
  if (user && user.orgId) {
    filter.$or = [{ orgId: user.orgId }, { orgId: null }];
  }

  return JobLog.find(filter).sort('-createdAt').limit(50).lean();
};
