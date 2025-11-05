import { Router } from "express";
import computingRouter from "@/routes/computing/index";

const router = Router();

router.use("/computing", computingRouter);

export default router;
