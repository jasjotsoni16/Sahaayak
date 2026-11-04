const { z } = require('zod');

const LANGUAGES = ['en', 'hi', 'pa', 'mr', 'ta', 'te', 'ml', 'kn', 'bn', 'gu'];

const geoPoint = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

// Unknown keys are stripped by zod's default object behaviour. That is the
// mass-assignment fix: a client cannot set credit_score, false_accusation_count, etc.
const COMPANY_TYPES = ['individual', 'business', 'enterprise', 'startup'];

const signupBase = z.object({
  name: z.string().trim().min(1).max(100),
  phone_number: z.string().trim().regex(/^\d{10}$/, 'must be a 10-digit number'),
  email: z.string().trim().email().optional(),
  password: z.string().min(8, 'must be at least 8 characters').max(100),
  role: z.enum(['seeker', 'provider', 'investor']),
  language: z.enum(LANGUAGES).optional(),
  address: z.string().max(300).optional(),
  pan: z.string().trim().max(10).optional(),
  city: z.string().trim().max(100).optional(),
  location: geoPoint.optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  company_name: z.string().max(200).optional(),
  company_type: z.string().max(100).optional(),
  gstin_number: z.string().max(20).optional(),
  investor_history: z.any().optional(),
});

// Employers need a complete company profile; reject it here so a half-valid
// signup never creates a User row.
exports.signupSchema = signupBase.superRefine((data, ctx) => {
  if (data.role !== 'provider') return;
  if (!data.company_name?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['company_name'], message: 'is required for employers' });
  }
  if (!COMPANY_TYPES.includes(data.company_type)) {
    ctx.addIssue({ code: 'custom', path: ['company_type'], message: `must be one of: ${COMPANY_TYPES.join(', ')}` });
  }
  if (!data.gstin_number?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['gstin_number'], message: 'is required for employers' });
  }
});

exports.loginSchema = z.object({
  phone_number: z.string().min(1),
  password: z.string().min(1),
});

exports.savingsGoalSchema = z.object({ monthly_savings_goal: z.number().min(0).max(10000000) });
