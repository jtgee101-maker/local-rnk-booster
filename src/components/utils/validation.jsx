import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(5, 'Email is too short')
  .max(100, 'Email is too long')
  .trim()
  .toLowerCase();

// Business name validation schema
export const businessNameSchema = z.string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name is too long')
  .trim()
  .regex(/^[a-zA-Z0-9\s\-'&.,]+$/, 'Business name contains invalid characters');

// Website validation schema
export const websiteSchema = z.string()
  .url('Please enter a valid website URL')
  .max(200, 'URL is too long')
  .trim()
  .optional()
  .or(z.literal(''));

// Phone validation schema
export const phoneSchema = z.string()
  .regex(/^[\d\s\-+()]+$/, 'Please enter a valid phone number')
  .min(10, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .trim()
  .optional()
  .or(z.literal(''));

// Place ID validation
export const placeIdSchema = z.string()
  .min(10, 'Invalid place ID')
  .max(200, 'Invalid place ID')
  .trim();

// Contact info validation schema
export const contactInfoSchema = z.object({
  email: emailSchema,
  business_name: businessNameSchema.optional(),
  website: websiteSchema.optional(),
  phone: phoneSchema.optional(),
});

// Business data validation schema
export const businessDataSchema = z.object({
  business_name: businessNameSchema,
  place_id: placeIdSchema,
  address: z.string().min(5).max(300).trim(),
  phone: phoneSchema.optional(),
  website: websiteSchema.optional(),
  gmb_rating: z.number().min(0).max(5).optional(),
  gmb_reviews_count: z.number().min(0).optional(),
  gmb_photos_count: z.number().min(0).optional(),
  gmb_has_hours: z.boolean().optional(),
  gmb_types: z.array(z.string()).optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
});

// Quiz data validation schema
export const quizDataSchema = z.object({
  business_category: z.enum(['home_services', 'medical', 'retail', 'professional', 'other']),
  pain_point: z.enum(['not_in_map_pack', 'low_reviews', 'no_calls', 'not_optimized']),
  goals: z.array(z.string()).min(1, 'Please select at least one goal'),
  timeline: z.enum(['urgent', '30_days', '60_days', 'planning']),
  email: emailSchema,
}).partial();

// Safe validation helper
export function validateInput(schema, data) {
  try {
    return {
      success: true,
      data: schema.parse(data),
      error: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: error.errors[0]?.message || 'Validation failed'
      };
    }
    return {
      success: false,
      data: null,
      error: 'Validation failed'
    };
  }
}