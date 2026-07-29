import { z } from 'zod';

export const dashboardFilterSchema = z.object({
  period: z.enum(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'custom']).optional().default('today'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  branchId: z.string().optional().nullable(),
  cashierId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable()
});
