import type { Request, Response } from 'express';
import { fibonacciService } from '@/services/computing/fibonacci.service';

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
  console.log('getFibonacci called');
  try {
    const { n } = req.query;
    if (!n || typeof n !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid query parameter n',
      });
      return;
    }
    const num = parseInt(n, 10);

    if (isNaN(num) || num < 0) {
      res.status(400).json({
        error: 'Invalid input. Please provide a non-negative integer.',
      });
      return;
    }

    if (num > 100) {
      res.status(400).json({
        error:
          'Number too large. Please provide a number less than or equal to 100.',
      });
      return;
    }

    const result = fibonacciService.calculate(num);

    res.json({
      input: num,
      fibonacci: result,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
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
    const { count } = req.query;
    if (!count || typeof count !== 'string') {
      res.status(400).json({
        error: 'Missing or invalid query parameter count',
      });
      return;
    }
    const num = parseInt(count, 10);

    if (isNaN(num) || num < 1) {
      res.status(400).json({
        error: 'Invalid input. Please provide a positive integer.',
      });
      return;
    }

    if (num > 50) {
      res.status(400).json({
        error:
          'Count too large. Please provide a count less than or equal to 50.',
      });
      return;
    }

    const sequence = fibonacciService.generateSequence(num);

    res.json({
      count: num,
      sequence,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

export const scheduleFibonacciTask = (req: Request, res: Response): void => {

}