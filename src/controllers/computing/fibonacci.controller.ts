import type { Request, Response } from 'express';
import { fibonacciService } from '@/services/computing/fibonacci.service';
import {
  validateFibonacciInput,
  validateFibonacciSequenceInput,
} from './validator';
import { ZodError } from 'zod';
import { getZodErrorResponse } from '@/utils/validation';

/**
 * @swagger
 * /api/computing/fibonacci:
 *   get:
 *     tags: [Computing]
 *     summary: Calculate nth Fibonacci number
 *     description: Returns the Fibonacci number at position n
 *     parameters:
 *       - in: query
 *         name: n
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Position in Fibonacci sequence (0-100)
 *     responses:
 *       200:
 *         description: Successful calculation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FibonacciResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getFibonacci = (req: Request, res: Response): void => {
  try {
    const num = validateFibonacciInput.parse(req.query['n']);
    const result = fibonacciService.calculate(num);
    res.json({
      input: num,
      fibonacci: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorRes = getZodErrorResponse(error);
      res.status(400).json(errorRes);
      return;
    }
    console.error(error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/computing/fibonacci/sequence:
 *   get:
 *     tags: [Computing]
 *     summary: Generate Fibonacci sequence
 *     description: Returns a sequence of Fibonacci numbers
 *     parameters:
 *       - in: query
 *         name: count
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: Number of Fibonacci numbers to generate (1-50)
 *     responses:
 *       200:
 *         description: Successful generation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FibonacciSequenceResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getFibonacciSequence = (req: Request, res: Response): void => {
  try {
    const count = validateFibonacciSequenceInput.parse(req.query['count']);
    const sequence = fibonacciService.generateSequence(count);

    res.json({
      count,
      sequence,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorRes = getZodErrorResponse(error);
      res.status(400).json(errorRes);
      return;
    }
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};
