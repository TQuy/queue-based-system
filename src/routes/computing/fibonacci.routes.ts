import { Router } from 'express';
import {
  getFibonacci,
  getFibonacciSequence,
  scheduleFibonacciCalculation,
} from '@/controllers/computing/fibonacci.controller';

const router = Router();

// GET /fibonacci?n=10 - Calculate nth fibonacci number
router.get('/', getFibonacci);

// GET /fibonacci/sequence?count=5 - Get fibonacci sequence
router.get('/sequence', getFibonacciSequence);

// POST /fibonacci/schedule - Schedule asynchronous fibonacci calculation
router.post('/schedule', scheduleFibonacciCalculation);

export default router;
