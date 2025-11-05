import type { Request, Response } from "express";
import { fibonacciService } from "@/services/computing/fibonacci.service";

export const getFibonacci = (req: Request, res: Response) => {
  try {
    const { n } = req.params;
    const num = parseInt(n, 10);

    if (isNaN(num) || num < 0) {
      return res.status(400).json({
        error: "Invalid input. Please provide a non-negative integer.",
      });
    }

    if (num > 100) {
      return res.status(400).json({
        error:
          "Number too large. Please provide a number less than or equal to 100.",
      });
    }

    const result = fibonacciService.calculate(num);

    res.json({
      input: num,
      fibonacci: result,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getFibonacciSequence = (req: Request, res: Response) => {
  try {
    const { count } = req.params;
    const num = parseInt(count, 10);

    if (isNaN(num) || num < 1) {
      return res.status(400).json({
        error: "Invalid input. Please provide a positive integer.",
      });
    }

    if (num > 50) {
      return res.status(400).json({
        error:
          "Count too large. Please provide a count less than or equal to 50.",
      });
    }

    const sequence = fibonacciService.generateSequence(num);

    res.json({
      count: num,
      sequence,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
