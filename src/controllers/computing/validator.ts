import { z } from 'zod';

export const validateFibonacciInput = z.preprocess(
  (val) => {
    if (typeof val === 'string' || typeof val === 'number') {
      return Number(val);
    }
    // If the value is null, undefined, or any other type, return it as is.
    // Since the next step expects a number, null/undefined will fail validation.
    return val;
  },
  z.number()
  .int()
  .min(0, 'Value must be non-negative')
    .max(100, 'Value too large, must be 100 or less')
);

export const validateFibonacciSequenceInput = z.coerce
  .number()
  .int()
  .min(1, 'Value must be positive')
  .max(50, 'Value too large, must be 50 or less');
