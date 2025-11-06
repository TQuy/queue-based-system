import { z } from 'zod';

export const validateFibonacciInput = z.coerce
  .number()
  .int()
  .min(0, 'Value must be non-negative')
  .max(100, 'Value too large, must be 100 or less');

export const validateFibonacciSequenceInput = z.coerce
  .number()
  .int()
  .min(1, 'Value must be positive')
  .max(50, 'Value too large, must be 50 or less');
