import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import type { Request, Response } from 'express';
import { fibonacciService } from '@/services/computing/fibonacci.service.js';
import {
  validateFibonacciInput,
  validateFibonacciSequenceInput,
} from '@/controllers/computing/validator.js';
import { getZodErrorResponse } from '@/utils/validation.utils.js';

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
      res.status(StatusCodes.BAD_REQUEST).json(errorRes);
      return;
    }
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
    });
  }
};

export const getFibonacciAsync = async (req: Request, res: Response): Promise<void> => {
  try {
    const num = validateFibonacciInput.parse(req.query['n']);
    const result = await fibonacciService.calculateAsync(num);
    res.json({
      input: num,
      fibonacci: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorRes = getZodErrorResponse(error);
      res.status(StatusCodes.BAD_REQUEST).json(errorRes);
      return;
    }
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
      res.status(StatusCodes.BAD_REQUEST).json(errorRes);
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
    });
  }
};

/**
 * @swagger
 * /api/computing/fibonacci/schedule:
 *   post:
 *     tags: [Computing]
 *     summary: Schedule asynchronous Fibonacci calculation
 *     description: |
 *       Schedules a Fibonacci calculation to be processed asynchronously via RabbitMQ message queue.
 *       The task is stored in Redis with a unique task ID for tracking purposes.
 *
 *       **Workflow:**
 *       1. Creates a unique task ID (UUID)
 *       2. Stores task metadata in Redis with 24-hour expiration
 *       3. Sends calculation request to RabbitMQ queue
 *       4. Updates task status to 'queued' in Redis
 *       5. Returns task ID for progress tracking
 *
 *       **Task Statuses:**
 *       - `pending`: Task created but not yet queued
 *       - `queued`: Task successfully sent to message queue
 *       - `processing`: Task being processed by worker
 *       - `completed`: Task finished successfully
 *       - `failed`: Task failed during processing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               n:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Position in Fibonacci sequence to calculate (0-100)
 *                 example: 10
 *             required: [n]
 *           examples:
 *             fibonacci_10:
 *               summary: Calculate 10th Fibonacci number
 *               value:
 *                 n: 10
 *             fibonacci_0:
 *               summary: Calculate 0th Fibonacci number
 *               value:
 *                 n: 0
 *     responses:
 *       200:
 *         description: Calculation successfully scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                   format: uuid
 *                   description: Unique identifier for tracking the scheduled task
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 message:
 *                   type: string
 *                   description: Confirmation message
 *                   example: "Fibonacci calculation has been scheduled."
 *               required: [taskId, message]
 *             examples:
 *               successful_schedule:
 *                 summary: Successfully scheduled calculation
 *                 value:
 *                   taskId: "550e8400-e29b-41d4-a716-446655440000"
 *                   message: "Fibonacci calculation has been scheduled."
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_parameter:
 *                 summary: Missing required parameter
 *                 value:
 *                   message: "Invalid input: Required"
 *                   path: "n"
 *               invalid_range:
 *                 summary: Parameter out of range
 *                 value:
 *                   message: "Invalid input: Number must be between 0 and 100"
 *                   path: "n"
 *       500:
 *         description: Failed to schedule calculation due to system error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error description
 *               required: [message]
 *             examples:
 *               queue_error:
 *                 summary: RabbitMQ connection failed
 *                 value:
 *                   message: "Failed to schedule Fibonacci calculation"
 *               redis_error:
 *                 summary: Redis storage failed
 *                 value:
 *                   message: "Failed to schedule Fibonacci calculation"
 */
export const scheduleFibonacciCalculation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const n = validateFibonacciInput.parse(req.body.n);
    const { taskId } = await fibonacciService.scheduleFibonacciCalculation(n);
    res.status(StatusCodes.ACCEPTED).json({
      taskId: taskId,
      message: 'Fibonacci calculation has been scheduled.',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorRes = getZodErrorResponse(error);
      res.status(StatusCodes.BAD_REQUEST).json(errorRes);
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
