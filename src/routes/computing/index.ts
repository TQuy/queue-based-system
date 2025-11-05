import { Router } from 'express';
import fibonacciRouter from './fibonacci.routes';

const router = Router();

router.use('/fibonacci', fibonacciRouter);

export default router;
