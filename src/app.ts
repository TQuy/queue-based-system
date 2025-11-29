import express from 'express';
import type { Request, Response, Application, NextFunction } from 'express';
import { setupSwagger } from '@/config/swagger.js';
import apiRoutes from '@/routes/api.routes.js';

/**
 * Creates and configures an Express application.
 * This function initializes the app, sets up middleware,
 * defines routes, and configures error handling.
 *
 * @returns {Application} The configured Express application instance.
 */
export const createApp = (): Application => {
  const app: Application = express();

  // --- 1. Core Middleware ---
  // Enable JSON body parsing
  app.use(express.json());
  // Enable URL-encoded body parsing
  app.use(express.urlencoded({ extended: true }));

  // --- 2. Swagger Documentation ---
  setupSwagger(app);

  // --- 3. API Routes ---
  app.get('/', (_req: Request, res: Response) => {
    res.send('Hello, TypeScript with Express!');
  });

  // Simple health check route
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // --- 3. 404 Not Found Handler ---
  // This catches any requests that don't match the routes above
  app.use((req: Request, res: Response, next: NextFunction) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the global error handler
  });

  // --- 4. Global Error Handler ---
  // This is the final middleware that catches all errors
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
      message: err.message,
      // You might want to hide the stack trace in production
      stack: process.env['NODE_ENV'] === 'production' ? '🥞' : err.stack,
    });
  });

  return app;
};
