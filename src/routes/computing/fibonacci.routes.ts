import { Router } from 'express';
import {
  getFibonacci,
  getFibonacciSequence,
} from '../../controllers/computing/fibonacci.controller.js';

const router = Router();

// GET /fibonacci?n=10 - Calculate nth fibonacci number
router.get('/', getFibonacci);

// GET /fibonacci/sequence?count=5 - Get fibonacci sequence
router.get('/sequence', getFibonacciSequence);

export default router;
