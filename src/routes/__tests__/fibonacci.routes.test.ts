import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';
import dotenv from 'dotenv';
import path from 'path';
import { createApp } from '@/app.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';

// Load .env for tests
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, 'config/.env') });

describe('Fibonacci Routes E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = createApp();

    // Initialize Redis and RabbitMQ for schedule tests
    try {
      await redisService.connect();
      await rabbitMQService.connect();
      console.log('✅ Services connected for tests');
    } catch (error) {
      console.warn('⚠️  Failed to connect to Redis/RabbitMQ:', error);
      // Continue anyway - synchronous tests should work
    }
  });

  afterAll(async () => {
    try {
      await redisService.disconnect();
      await rabbitMQService.cleanup();
    } catch (error) {
      console.warn('⚠️  Failed to disconnect services:', error);
    }
  });

  describe('GET /api/computing/fibonacci', () => {
    describe('Valid requests', () => {
      it('should calculate fibonacci number for valid positive input', async () => {
        const input = 10;
        const expectedResult = 55;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.OK);

        expect(response.body).toHaveProperty('input', input);
        expect(response.body).toHaveProperty('fibonacci');
        expect(typeof response.body.fibonacci).toBe('number');
      });
    });

    describe('Invalid requests', () => {
      it('should return 400 for missing n parameter', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'expected number, received'
        );
      });

      it('should return 400 for negative input', async () => {
        const input = -1;
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: input })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Value must be non-negative');
      });

      it('should return 400 for input greater than maximum (100)', async () => {
        const invalidInput = 101;

        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: invalidInput })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          'Value too large, must be 100 or less'
        );
      });

      it('should return 400 for non-numeric input', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: 'invalid' })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain(
          'expected number, received NaN'
        );
      });

      it('should return 400 for decimal input', async () => {
        const response = await request(app)
          .get('/api/computing/fibonacci')
          .query({ n: '10.5' })
          .expect(StatusCodes.BAD_REQUEST);

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
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.OK);

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
          .expect(StatusCodes.BAD_REQUEST);

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
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Value must be positive');
      });

      it('should return 400 for count greater than maximum (50)', async () => {
        const invalidInput = 51;

        const response = await request(app)
          .get('/api/computing/fibonacci/sequence')
          .query({ count: invalidInput })
          .expect(StatusCodes.BAD_REQUEST);

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
        .expect(StatusCodes.NOT_FOUND);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Not Found');
    });

    it('should handle malformed query parameters gracefully', async () => {
      // Test with a value that cannot be coerced to a valid number
      const response = await request(app)
        .get('/api/computing/fibonacci')
        .query({ n: 'not-a-number' })
        .expect(StatusCodes.BAD_REQUEST);

      expect(response.body).toHaveProperty('message');
    });

    it('should return proper content-type headers', async () => {
      const response = await request(app)
        .get('/api/computing/fibonacci')
        .query({ n: 5 })
        .expect(StatusCodes.OK);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /api/computing/fibonacci/schedule', () => {
    describe('Valid requests', () => {
      it('should schedule fibonacci calculation with valid input', async () => {
        const input = 10;

        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.ACCEPTED);

        expect(response.body).toHaveProperty('taskId');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('scheduled');
        expect(typeof response.body.taskId).toBe('string');
        expect(response.body.taskId.length).toBeGreaterThan(0);
      });

      it('should schedule fibonacci calculation for n=0', async () => {
        const input = 0;

        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.ACCEPTED);

        expect(response.body).toHaveProperty('taskId');
        expect(response.body).toHaveProperty('message');
      });

      it('should schedule fibonacci calculation for n=1', async () => {
        const input = 1;

        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.ACCEPTED);

        expect(response.body).toHaveProperty('taskId');
      });

      it('should generate unique taskIds for multiple requests', async () => {
        const input = 5;

        const response1 = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.ACCEPTED);

        const response2 = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.ACCEPTED);

        expect(response1.body.taskId).not.toBe(response2.body.taskId);
      });
    });

    describe('Invalid requests', () => {
      it('should return 400 for missing n parameter', async () => {
        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({})
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for negative input', async () => {
        const input = -1;

        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('non-negative');
      });

      it('should return 400 for input greater than maximum (100)', async () => {
        const input = 101;

        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: input })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for non-numeric input', async () => {
        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: 'not-a-number' })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
      });

      it('should return 400 for null input', async () => {
        const response = await request(app)
          .post('/api/computing/fibonacci/schedule')
          .send({ n: null })
          .expect(StatusCodes.BAD_REQUEST);

        expect(response.body).toHaveProperty('message');
      });
    });
  });
});
