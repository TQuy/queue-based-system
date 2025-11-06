#!/usr/bin/env node

import { z } from 'zod';
import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils';

const inputValidator = z.coerce
  .number()
  .int()
  .min(0, 'Value must be non-negative')
  .max(100, 'Value too large, must be 100 or less');

// Get the number from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Error: Please provide a number as an argument');
  process.exit(1);
}

try {
  const n = inputValidator.parse(args[0]);
  const result = calculateFibonacciNumber(n);

  // Output the result to stdout
  console.log(`worker result: ${result}`);
  process.exit(0);
} catch (error) {
  // Output error to stderr
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`Error calculating Fibonacci: ${errorMessage}`);
  process.exit(1);
}
