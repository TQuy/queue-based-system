import { Router } from 'express';
import computingRouter from '@/routes/computing';

const router = Router();

router.use('/computing', computingRouter);

export default router;
