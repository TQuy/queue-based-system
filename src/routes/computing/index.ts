import { Router } from 'express';
import fibonacciRouter from '@/routes/computing/fibonacci.routes.js';

const router = Router();

router.use('/fibonacci', fibonacciRouter);

export default router;
