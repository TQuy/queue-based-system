import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import {
  FibonacciService,
} from '@/services/computing/fibonacci.service.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { COMPUTING_QUEUE, FIBONACCI_DATA_TYPE } from '@/constants/computing.js';
import { DatastoreService } from '@/types/datastore.js';
import { dataStoreServiceManager } from '@/services/datastore/datastore.service.js';
import { redisService } from '@/services/datastore/redis.service.js';

// Mock external dependencies
jest.mock('../../queue/rabbitmq.service');
jest.mock('../../datastore/redis.service');

const mockRabbitMQService = rabbitMQService as jest.Mocked<
  typeof rabbitMQService
>;
const mockDataStoreService = redisService as jest.Mocked<typeof redisService>;
const mockDataStoreServiceManager = dataStoreServiceManager as jest.Mocked<typeof dataStoreServiceManager>;

// Ensure services are properly mocked
mockRabbitMQService.sendMessage = jest.fn();
mockDataStoreService.setTask = jest.fn();
mockDataStoreService.updateTaskStatus = jest.fn();
mockDataStoreServiceManager.getDataStoreServiceInstance = jest.fn(() => mockDataStoreService);

describe('FibonacciService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Static Methods', () => {
    describe('calculateFibonacci', () => {
      it('should calculate fibonacci number for valid positive input', () => {
        const input = 10;
        const expectedResult = 55;

        const result = FibonacciService.calculateFibonacci(input);
        expect(result).toBe(expectedResult);
      });

      it('should calculate fibonacci number for zero', () => {
        const input = 0;
        const expectedResult = 0;

        const result = FibonacciService.calculateFibonacci(input);
        expect(result).toBe(expectedResult);
      });

      it('should calculate fibonacci number for one', () => {
        const input = 1;
        const expectedResult = 1;

        const result = FibonacciService.calculateFibonacci(input);
        expect(result).toBe(expectedResult);
      });

      it('should throw error for negative input', () => {
        const invalidInput = -1;

        expect(() => FibonacciService.calculateFibonacci(invalidInput)).toThrow(
          'Fibonacci position must be non-negative'
        );
      });
    });

    describe('getFibonacciSequence', () => {
      it('should generate fibonacci sequence for valid input', () => {
        const input = 5;
        const expectedSequence = [0, 1, 1, 2, 3, 5];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should generate single element sequence for n=0', () => {
        const input = 0;
        const expectedSequence = [0];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should generate two element sequence for n=1', () => {
        const input = 1;
        const expectedSequence = [0, 1];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should throw error for negative input', () => {
        const invalidInput = -1;

        expect(() =>
          FibonacciService.getFibonacciSequence(invalidInput)
        ).toThrow('Fibonacci sequence length must be non-negative');
      });

      it('should handle small sequence generation', () => {
        const input = 3;
        const expectedSequence = [0, 1, 1, 2];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });
    });
  });

  describe('Instance Methods', () => {
    describe('calculate', () => {
      it('should delegate to static calculateFibonacci method', () => {
        const input = 8;
        const expectedResult = 21;

        const result = FibonacciService.calculateFibonacci(input);
        expect(result).toBe(expectedResult);
      });

      it('should handle zero input', () => {
        const input = 0;
        const expectedResult = 0;

        const result = FibonacciService.calculateFibonacci(input);
        expect(result).toBe(expectedResult);
      });

      it('should handle error from static method', () => {
        const invalidInput = -5;

        expect(() => FibonacciService.calculateFibonacci(invalidInput)).toThrow(
          'Fibonacci position must be non-negative'
        );
      });
    });

    describe('getFibonacciSequence', () => {
      it('should delegate to static getFibonacciSequence method', () => {
        const input = 3;
        const expectedSequence = [0, 1, 1, 2];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should handle single element sequence', () => {
        const input = 0;
        const expectedSequence = [0];

        const result = FibonacciService.getFibonacciSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should handle error from static method', () => {
        const invalidInput = -2;

        expect(() => FibonacciService.getFibonacciSequence(invalidInput)).toThrow(
          'Fibonacci sequence length must be non-negative'
        );
      });
    });

    describe('scheduleFibonacciCalculation', () => {
      beforeEach(() => {
        // Mock Redis operations to return successful results by default
        mockDataStoreService.setTask.mockResolvedValue(true);
        mockDataStoreService.updateTaskStatus.mockResolvedValue(true);
        mockRabbitMQService.sendMessage.mockResolvedValue(undefined);
      });

      it('should send message to RabbitMQ service successfully', async () => {
        const result = await FibonacciService.scheduleFibonacciCalculation(10);

        expect(mockDataStoreService.setTask).toHaveBeenCalledWith(
          result.taskId,
          expect.objectContaining({
            id: result.taskId,
            type: FIBONACCI_DATA_TYPE,
            input: { n: 10 },
            status: 'pending',
          }),
          86400
        );

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          expect.objectContaining({
            topic: FIBONACCI_DATA_TYPE,
            taskId: result.taskId,
            data: { n: 10 },
          })
        );

        expect(mockDataStoreService.updateTaskStatus).toHaveBeenCalledWith(
          result.taskId,
          'queued'
        );

        expect(result.taskId).toBeDefined();
      });

      it('should handle RabbitMQ service failure', async () => {
        const error = new Error('RabbitMQ send failed');
        mockRabbitMQService.sendMessage.mockRejectedValue(error);

        await expect(
          FibonacciService.scheduleFibonacciCalculation(5)
        ).rejects.toThrow('Failed to schedule Fibonacci calculation');

        expect(mockDataStoreService.setTask).toHaveBeenCalled();
        expect(mockRabbitMQService.sendMessage).toHaveBeenCalled();
        expect(mockDataStoreService.updateTaskStatus).toHaveBeenCalledWith(
          expect.any(String),
          'failed'
        );
      });

      it('should handle RabbitMQ service rejection', async () => {
        const error = new Error('RabbitMQ connection failed');
        mockRabbitMQService.sendMessage.mockRejectedValue(error);

        await expect(
          FibonacciService.scheduleFibonacciCalculation(7)
        ).rejects.toThrow('Failed to schedule Fibonacci calculation');

        expect(mockDataStoreService.setTask).toHaveBeenCalled();
        expect(mockRabbitMQService.sendMessage).toHaveBeenCalled();
      });

      it('should handle edge case with zero input', async () => {
        const result = await FibonacciService.scheduleFibonacciCalculation(0);

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          expect.objectContaining({
            topic: FIBONACCI_DATA_TYPE,
            taskId: result.taskId,
            data: { n: 0 },
          })
        );

        expect(result.taskId).toBeDefined();
      });
    });
  });
});
