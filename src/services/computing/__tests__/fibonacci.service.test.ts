import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { FibonacciService, fibonacciService } from '../fibonacci.service';
import { rabbitMQService } from '../../queue/rabbitmq.service';
import { COMPUTING_QUEUE } from '@/constants/computing';

// Only mock external dependencies (RabbitMQ), not our own utilities
jest.mock('../../queue/rabbitmq.service');

const mockRabbitMQService = rabbitMQService as jest.Mocked<
  typeof rabbitMQService
>;

// Ensure sendMessage is properly mocked
mockRabbitMQService.sendMessage = jest.fn();

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

        const result = fibonacciService.calculate(input);
        expect(result).toBe(expectedResult);
      });

      it('should handle zero input', () => {
        const input = 0;
        const expectedResult = 0;

        const result = fibonacciService.calculate(input);
        expect(result).toBe(expectedResult);
      });

      it('should handle error from static method', () => {
        const invalidInput = -5;

        expect(() => fibonacciService.calculate(invalidInput)).toThrow(
          'Fibonacci position must be non-negative'
        );
      });
    });

    describe('generateSequence', () => {
      it('should delegate to static getFibonacciSequence method', () => {
        const input = 3;
        const expectedSequence = [0, 1, 1, 2];

        const result = fibonacciService.generateSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should handle single element sequence', () => {
        const input = 0;
        const expectedSequence = [0];

        const result = fibonacciService.generateSequence(input);
        expect(result).toEqual(expectedSequence);
      });

      it('should handle error from static method', () => {
        const invalidInput = -2;

        expect(() => fibonacciService.generateSequence(invalidInput)).toThrow(
          'Fibonacci sequence length must be non-negative'
        );
      });
    });

    describe('scheduleFibonacciCalculation', () => {
      it('should send message to RabbitMQ service successfully', async () => {
        mockRabbitMQService.sendMessage.mockResolvedValue(true);

        const result = await fibonacciService.scheduleFibonacciCalculation(10);

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          {
            topic: 'fibonacci.calculate',
            data: { n: 10 },
          }
        );
        expect(result).toBe(true);
      });

      it('should handle RabbitMQ service failure', async () => {
        mockRabbitMQService.sendMessage.mockResolvedValue(false);

        const result = await fibonacciService.scheduleFibonacciCalculation(5);

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          {
            topic: 'fibonacci.calculate',
            data: { n: 5 },
          }
        );
        expect(result).toBe(false);
      });

      it('should handle RabbitMQ service rejection', async () => {
        const error = new Error('RabbitMQ connection failed');
        mockRabbitMQService.sendMessage.mockRejectedValue(error);

        await expect(
          fibonacciService.scheduleFibonacciCalculation(7)
        ).rejects.toThrow('RabbitMQ connection failed');

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          {
            topic: 'fibonacci.calculate',
            data: { n: 7 },
          }
        );
      });

      it('should handle edge case with zero input', async () => {
        mockRabbitMQService.sendMessage.mockResolvedValue(true);

        const result = await fibonacciService.scheduleFibonacciCalculation(0);

        expect(mockRabbitMQService.sendMessage).toHaveBeenCalledWith(
          COMPUTING_QUEUE,
          {
            topic: 'fibonacci.calculate',
            data: { n: 0 },
          }
        );
        expect(result).toBe(true);
      });
    });
  });

  describe('Class and Instance Export', () => {
    it('should export both class and instance', () => {
      expect(FibonacciService).toBeDefined();
      expect(fibonacciService).toBeDefined();
      expect(fibonacciService).toBeInstanceOf(FibonacciService);
    });

    it('should maintain separate state for different instances', () => {
      const instance1 = new FibonacciService();
      const instance2 = new FibonacciService();

      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(FibonacciService);
      expect(instance2).toBeInstanceOf(FibonacciService);
    });
  });
});
