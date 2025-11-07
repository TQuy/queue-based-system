import request from 'supertest';
import { createApp } from '@/app';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Fibonacci Routes E2E Tests', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/computing/fibonacci', () => {
    describe('Valid requests', () => {
      it('should calculate fibonacci number for valid positive input', async () => {
        const input = 10;
        const expectedResult = 55;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(200);

        expect(response.body).toEqual({
          input: input,
          fibonacci: expectedResult,
        });
      });

      it('should calculate fibonacci number for zero', async () => {
        const input = 0;
        const expectedResult = 0;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(200);

        expect(response.body).toEqual({
          input: input,
          fibonacci: expectedResult,
        });
      });

      it('should calculate fibonacci number for one', async () => {
        const input = 1;
        const expectedResult = 1;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(200);

        expect(response.body).toEqual({
          input: input,
          fibonacci: expectedResult,
        });
      });

      it('should handle maximum allowed input (100)', async () => {
        const input = 100;
        // F(100) is a very large number, but we just want to verify it doesn't error

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(200);

        expect(response.body).toHaveProperty('input', input);
        expect(response.body).toHaveProperty('fibonacci');
        expect(typeof response.body.fibonacci).toBe('number');
      });
    });

    describe('Invalid requests', () => {
      it('should return 400 for missing n parameter', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'expected number, received NaN'
        );
      });

      it('should return 400 for negative input', async () => {
        const input = -1;
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Value must be non-negative');
      });

      it('should return 400 for input greater than maximum (100)', async () => {
        const invalidInput = 101;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: invalidInput })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          'Value too large, must be 100 or less'
        );
      });

      it('should return 400 for non-numeric input', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: 'invalid' })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'expected number, received NaN'
        );
      });

      it('should return 400 for decimal input', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: '10.5' })
          .expect(400);

        console.log(`response.body`, response.body);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'Invalid input: expected int, received number'
        );
      });
    });
  });

  describe('GET /api/computing/fibonacci/sequence', () => {
    describe('Valid requests', () => {
      it('should generate fibonacci sequence for valid input', async () => {
        const input = 5;
        const expectedSequence = [0, 1, 1, 2, 3, 5];

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: input })
          .expect(200);

        expect(response.body).toEqual({
          count: input,
          sequence: expectedSequence,
        });
      });

      it('should generate single element sequence for count=1', async () => {
        const input = 1;
        const expectedSequence = [0, 1];

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: input })
          .expect(200);

        expect(response.body).toEqual({
          count: input,
          sequence: expectedSequence,
        });
      });

      it('should handle maximum allowed count (50)', async () => {
        const input = 50;

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: input })
          .expect(200);

        expect(response.body).toHaveProperty('count', input);
        expect(response.body).toHaveProperty('sequence');
        expect(Array.isArray(response.body.sequence)).toBe(true);
        expect(response.body.sequence).toHaveLength(input + 1); // count + 1 elements (0 to count)
      });
    });

    describe('Invalid requests', () => {
      it('should return 400 for missing count parameter', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'expected number, received NaN'
        );
      });

      it('should return 400 for negative count', async () => {
        const invalidInput = -1;

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: invalidInput })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Value must be positive');
      });

      it('should return 400 for count greater than maximum (50)', async () => {
        const invalidInput = 51;

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: invalidInput })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          'Value too large, must be 50 or less'
        );
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return 404 for non-existent fibonacci endpoints', async () => {
      const response = await request(app)
        .get('/api/computing/fibonacci/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not Found');
    });

    it('should handle malformed query parameters gracefully', async () => {
      // Test with a value that cannot be coerced to a valid number
      const response = await request(app)
        .get('/api/computing/fibonacci')
        .query({ n: 'not-a-number' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return proper content-type headers', async () => {
      const response = await request(app)
        .get('/api/computing/fibonacci')
        .query({ n: 5 })
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
