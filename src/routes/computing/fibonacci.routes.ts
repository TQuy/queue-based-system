import { Router } from 'express';
import {
  getFibonacci,
  getFibonacciAsync,
  getFibonacciSequence,
  scheduleFibonacciCalculation,
} from '@/controllers/computing/fibonacci.controller.js';

const router = Router();

// GET /fibonacci?n=10 - Calculate nth fibonacci number
router.get('/', getFibonacci);

router.get('/async', getFibonacciAsync);

// GET /fibonacci/sequence?count=5 - Get fibonacci sequence
router.get('/sequence', getFibonacciSequence);

// POST /fibonacci/schedule - Schedule asynchronous fibonacci calculation
router.post('/schedule', scheduleFibonacciCalculation);

export default router;
