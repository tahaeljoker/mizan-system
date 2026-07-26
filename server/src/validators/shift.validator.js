import { z } from 'zod';

export const openShiftSchema = z.object({
  openingCash: z.coerce.number({ required_error: 'مبلغ بداية الورقية/الوردية مطلوب' }).min(0, 'المبلغ لا يمكن أن يكون سالباً').optional().default(0),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional().default('')
});

export const closeShiftSchema = z.object({
  actualCash: z.coerce.number({ required_error: 'المبلغ النقدي المكتشف في الدرج مطلوب' }).min(0, 'المبلغ لا يمكن أن يكون سالباً'),
  notes: z.string().optional().default('')
});
