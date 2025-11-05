import { Router } from "express";
import {
  getFibonacci,
  getFibonacciSequence,
} from "@/controllers/computing/fibonacci.controller";

const router = Router();

// GET /fibonacci/:n - Calculate nth fibonacci number
router.get("/:n", getFibonacci);

// GET /fibonacci/sequence/:count - Get fibonacci sequence
router.get("/sequence/:count", getFibonacciSequence);

export default router;
