import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils';
import { rabbitMQService } from '@/services/queue/rabbitmq.service';
import { COMPUTING_QUEUE } from '@/constants/computing';
import { redisService } from '@/services/datastore/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { TaskData } from '../datastore/types';

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

  async scheduleFibonacciCalculation(n: number): Promise<{ taskId: string }> {
    // Generate unique task ID
    const taskId = uuidv4();

    // Create task metadata
    const taskData: TaskData = {
      id: taskId,
      type: 'fibonacci.calculate',
      input: { n },
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let success = true;

    try {
      // Store task in Redis with expiration (24 hours)
      await redisService.setTask(taskId, taskData, 86400);

      // Send message to RabbitMQ with task ID
      await rabbitMQService.sendMessage(COMPUTING_QUEUE, {
        topic: 'fibonacci.calculate',
        taskId,
        data: { n },
      });

      return { taskId };
    } catch (error) {
      success = false;
      throw new Error('Failed to schedule Fibonacci calculation', {
        cause: error,
      });
    } finally {
      const status = success ? 'queued' : 'failed';
      try {
        await redisService.updateTaskStatus(taskId, status);
      } catch (updateError) {
        console.error(
          new Error(`Failed to update task status to ${status}:`, { cause: updateError })
        );
      }
    }
  }
}

// Export both class and instance
export const fibonacciService = new FibonacciService();
export default FibonacciService;
