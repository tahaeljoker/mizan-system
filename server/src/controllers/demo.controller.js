import { DEMO_ACCOUNTS, DEMO_ORG_NAME, seedDemoEnvironment } from '../../seeders/demo.seeder.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getDemoAccounts = async (req, res) => {
  try {
    return successResponse(res, { accounts: DEMO_ACCOUNTS }, 'Demo accounts list fetched successfully', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch demo accounts', 500);
  }
};

export const getDemoStatus = async (req, res) => {
  try {
    return successResponse(res, {
      status: 'active',
      organization: DEMO_ORG_NAME,
      resetIntervalHours: 24,
      allowManualReset: true
    }, 'Demo status fetched', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch demo status', 500);
  }
};

export const resetDemoEnvironment = async (req, res) => {
  try {
    const result = await seedDemoEnvironment();
    return successResponse(res, { result: 'Demo database reset successfully' }, 'تم إعادة ضبط بيئة مدار التجريبية بنجاح! 🎉', 200);
  } catch (error) {
    return errorResponse(res, 'فشل في إعادة ضبط البيئة التجريبية: ' + error.message, 500);
  }
};

export const getDemoInfo = async (req, res) => {
  try {
    return successResponse(res, {
      name: 'Madar ERP/POS Sandbox Demo',
      description: 'بيئة تجريبية عامة لاستكشاف كافة موديولات منصة مدار بأمان التام',
      accountsCount: DEMO_ACCOUNTS.length,
      organization: DEMO_ORG_NAME
    }, 'Demo info fetched', 200);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch demo info', 500);
  }
};
