import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils';

describe('calculateFibonacciNumber', () => {
  describe('valid inputs', () => {
    it('should return 0 for n = 0', () => {
      expect(calculateFibonacciNumber(0)).toBe(0);
    });

    it('should return 1 for n = 1', () => {
      expect(calculateFibonacciNumber(1)).toBe(1);
    });

    it('should calculate correct fibonacci numbers for small values', () => {
      expect(calculateFibonacciNumber(2)).toBe(1);
      expect(calculateFibonacciNumber(3)).toBe(2);
      expect(calculateFibonacciNumber(4)).toBe(3);
      expect(calculateFibonacciNumber(5)).toBe(5);
      expect(calculateFibonacciNumber(6)).toBe(8);
      expect(calculateFibonacciNumber(7)).toBe(13);
      expect(calculateFibonacciNumber(8)).toBe(21);
    });

    it('should calculate correct fibonacci numbers for larger values', () => {
      expect(calculateFibonacciNumber(10)).toBe(55);
      expect(calculateFibonacciNumber(15)).toBe(610);
      expect(calculateFibonacciNumber(20)).toBe(6765);
    });
  });

  describe('invalid inputs', () => {
    it('should throw error for negative numbers', () => {
      expect(() => calculateFibonacciNumber(-1)).toThrow(
        'n needs to be non-negative'
      );
      expect(() => calculateFibonacciNumber(-5)).toThrow(
        'n needs to be non-negative'
      );
      expect(() => calculateFibonacciNumber(-100)).toThrow(
        'n needs to be non-negative'
      );
    });

    it('should throw error for non-integer numbers', () => {
      expect(() => calculateFibonacciNumber(1.5)).toThrow(
        'n must be an integer'
      );
      expect(() => calculateFibonacciNumber(3.14)).toThrow(
        'n must be an integer'
      );
      expect(() => calculateFibonacciNumber(-2.5)).toThrow(
        'n must be an integer'
      );
    });

    it('should throw error for NaN', () => {
      expect(() => calculateFibonacciNumber(NaN)).toThrow(
        'n must be an integer'
      );
    });

    it('should throw error for Infinity', () => {
      expect(() => calculateFibonacciNumber(Infinity)).toThrow(
        'n must be an integer'
      );
      expect(() => calculateFibonacciNumber(-Infinity)).toThrow(
        'n must be an integer'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle zero correctly', () => {
      expect(calculateFibonacciNumber(0)).toBe(0);
    });

    it('should handle large integers within JavaScript number precision', () => {
      expect(calculateFibonacciNumber(30)).toBe(832040);
      expect(calculateFibonacciNumber(35)).toBe(9227465);
    });
  });
});
