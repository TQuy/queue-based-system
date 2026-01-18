
import { Worker } from 'worker_threads';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils.js';
import { COMPUTING_QUEUE, FIBONACCI_DATA_TYPE } from '@/constants/computing.js';
import { isDev, isTest } from '@/utils/environment.utils.js';
import { TaskData } from '@/types/index.js';
import { dataStoreServiceManager } from '@/services/datastore/datastore.service.js';
import { messageBrokerManager } from '@/services/queue/messageBroker.service.js';

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

  static async scheduleFibonacciCalculation(
    n: number,
  ): Promise<{ taskId: string }> {
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

    const dataStoreService = dataStoreServiceManager.getDataStoreServiceInstance();
    const messageBrokerService = messageBrokerManager.getMessageBrokerService();
    try {
      // Store task in Redis with expiration (24 hours)
      await dataStoreService.setTask(taskId, taskData, 86400);

      // Send message to RabbitMQ with task ID
      await messageBrokerService.sendMessage(COMPUTING_QUEUE, {
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
        await dataStoreService.updateTaskStatus(taskId, status);
      } catch (updateError) {
        console.error(
          new Error(`Failed to update task status to ${status}:`, { cause: updateError })
        );
      }
    }
  }

  static async calculateAsync(n: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      // Always use compiled JS to avoid path alias resolution issues in Worker threads
      // Worker threads don't support TypeScript path aliases, so we depend on pre-compiled JS
      const rootDir = process.cwd();
      const workerPath = path.join(rootDir, 'dist', 'workers', 'computing', 'fibonacci.workerThread.js');

      console.log('Initializing worker at path:', workerPath);
      const worker = new Worker(workerPath, {
        // No execArgv needed - worker uses compiled JS
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
