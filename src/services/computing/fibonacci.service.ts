
import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { COMPUTING_QUEUE, FIBONACCI_DATA_TYPE } from '@/constants/computing.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { isDev, isTest } from '@/utils/environment.utils.js';
import { TaskData } from '@/types/index.js';

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

  static async scheduleFibonacciCalculation(n: number): Promise<{ taskId: string }> {
    // Generate unique task ID
    const taskId = uuidv4();

    // Create task metadata
    const taskData: TaskData = {
      id: taskId,
      type: FIBONACCI_DATA_TYPE,
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
        topic: FIBONACCI_DATA_TYPE,
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

  static async calculateAsync(n: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      // In dev/test: use tsx to run TS files with path aliases
      // In prod: use compiled JS (no runtime TS/path-alias overhead)
      const isDevTest = isTest() || isDev();
      const rootDir = process.cwd();

      let workerPath: string = isDevTest ?
        path.join(rootDir, 'dist', 'workers', 'computing', 'fibonacci.workerThread.js') :
        path.join(rootDir, 'workers', 'computing', 'fibonacci.workerThread.js');
      let execArgs: string[] = [];

      // 🚀 Worker Initialization
      const worker = new Worker(workerPath, {
        execArgv: execArgs,
      });

      worker.postMessage({ n });

      worker.on('message', (response: {
        success: boolean;
        result?: number;
        error?: string;
      }) => {
        if (response.success && response.result !== undefined) {
          resolve(response.result);
        } else {
          reject(new Error(response.error || 'Worker computation failed'));
        }
        void worker.terminate();
      });

      worker.on('error', (err) => {
        reject(err);
        void worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}


// Export both class and instance
export default FibonacciService;
