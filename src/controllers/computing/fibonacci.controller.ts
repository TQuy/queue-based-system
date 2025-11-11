import { ZodError } from 'zod';
import type { Request, Response } from 'express';
import { fibonacciService } from '@/services/computing/fibonacci.service';
import {
  validateFibonacciInput,
  validateFibonacciSequenceInput,
} from '@/controllers/computing/validator';
import { getZodErrorResponse } from '@/utils/validation.utils';

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

/**
 * @swagger
 * /api/computing/fibonacci/schedule:
 *   get:
 *     tags: [Computing]
 *     summary: Schedule Fibonacci calculation
 *     description: Schedules a Fibonacci calculation to be processed asynchronously via message queue
 *     parameters:
 *       - in: query
 *         name: n
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Position in Fibonacci sequence to calculate (0-100)
 *     responses:
 *       200:
 *         description: Calculation successfully scheduled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to schedule calculation or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduleResponse'
 */
export const scheduleFibonacciCalculation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const n = validateFibonacciInput.parse(req.query['n']);
    const { taskId } = await fibonacciService.scheduleFibonacciCalculation(n);
    res.json({
      taskId: taskId,
      message: 'Fibonacci calculation has been scheduled.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorRes = getZodErrorResponse(error);
      res.status(400).json(errorRes);
      return;
    }
    res.status(500).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
