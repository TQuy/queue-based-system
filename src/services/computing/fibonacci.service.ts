import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils';
import { rabbitMQService } from '../queue/rabbitmq.service';
import { COMPUTING_QUEUE } from '@/constants/computing';

export class FibonacciService {
  /**
   * Calculate fibonacci number for given position
   */
  static calculateFibonacci(n: number): number {
    if (n < 0) {
      throw new Error('Fibonacci position must be non-negative');
    }
    return calculateFibonacciNumber(n);
  }

  /**
   * Calculate fibonacci sequence up to given position
   */
  static getFibonacciSequence(n: number): number[] {
    if (n < 0) {
      throw new Error('Fibonacci sequence length must be non-negative');
    }

    const sequence: number[] = [];
    for (let i = 0; i <= n; i++) {
      sequence.push(calculateFibonacciNumber(i));
    }
    return sequence;
  }

  // Instance methods for compatibility
  calculate(n: number): number {
    return FibonacciService.calculateFibonacci(n);
  }

  generateSequence(n: number): number[] {
    return FibonacciService.getFibonacciSequence(n);
  }

  scheduleFibonacciCalculation(n: number): Promise<boolean> {
    return rabbitMQService.sendMessage(COMPUTING_QUEUE, {
      topic: 'fibonacci.calculate',
      data: { n },
    });
  }
}

// Export both class and instance
export const fibonacciService = new FibonacciService();
export default FibonacciService;
