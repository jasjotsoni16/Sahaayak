const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid id');

exports.createAgreementSchema = z.object({
  employee_id: objectId,
  amount: z.number().positive().max(10000000),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  description: z.string().trim().max(200).optional(),
  job_id: objectId.optional(),
});

exports.statusSchema = z.object({ status: z.enum(['active', 'paused', 'ended']) });

exports.recordPaymentSchema = z.object({
  amount: z.number().positive().max(10000000).optional(), // defaults to the agreed amount
  paid_on: z.coerce.date().optional(),
  note: z.string().trim().max(200).optional(),
});

exports.disputeSchema = z.object({ reason: z.string().trim().min(1).max(300) });
