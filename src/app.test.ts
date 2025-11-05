import request from 'supertest'; // A popular library for testing HTTP
import { createApp } from './app';
import { describe, it, expect } from '@jest/globals';

// Create the app instance *once* for all tests in this suite
const app = createApp();

describe('GET /health', () => {
  it('should return 200 OK and status: ok', async () => {
    const response = await request(app) // Use supertest
      .get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('404 Error Handler', () => {
  it('should return 404 for a route that does not exist', async () => {
    const response = await request(app).get('/nonexistent-route-123');

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('Not Found');
  });
});
