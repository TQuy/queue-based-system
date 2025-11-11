import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Media Prototype API',
      version: '1.0.0',
      description: 'TypeScript Express.js API with comprehensive documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: '{protocol}://{host}:{port}',
        description: 'Configurable server',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http',
          },
          host: {
            default: 'localhost',
          },
          port: {
            default: '3000',
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        FibonacciResponse: {
          type: 'object',
          properties: {
            input: {
              type: 'number',
              example: 10,
              description: 'The input number for Fibonacci calculation',
            },
            fibonacci: {
              type: 'number',
              example: 55,
              description: 'The calculated Fibonacci number',
            },
          },
          required: ['input', 'fibonacci'],
        },
        FibonacciSequenceResponse: {
          type: 'object',
          properties: {
            count: {
              type: 'number',
              example: 5,
              description: 'Number of Fibonacci numbers requested',
            },
            sequence: {
              type: 'array',
              items: {
                type: 'number',
              },
              example: [0, 1, 1, 2, 3],
              description: 'Array of Fibonacci numbers',
            },
          },
          required: ['count', 'sequence'],
        },
        ScheduleResponse: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
              description: 'Unique identifier for tracking the scheduled task',
            },
            message: {
              type: 'string',
              example: 'Fibonacci calculation has been scheduled.',
              description: 'Confirmation message for scheduled calculation',
            },
          },
          required: ['taskId', 'message'],
        },
        TaskStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
              description: 'Unique task identifier',
            },
            type: {
              type: 'string',
              example: 'fibonacci.calculate',
              description: 'Type of task being performed',
            },
            input: {
              type: 'object',
              description: 'Input parameters for the task',
              example: { n: 10 },
            },
            status: {
              type: 'string',
              enum: ['pending', 'queued', 'processing', 'completed', 'failed'],
              example: 'completed',
              description: 'Current status of the task',
            },
            result: {
              type: 'object',
              description:
                'Task result (only present when status is completed)',
              example: { fibonacci: 55 },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00.000Z',
              description: 'When the task was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:05.000Z',
              description: 'When the task was last updated',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:05.000Z',
              description:
                'When the task was completed (only present when status is completed)',
            },
            failedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:05.000Z',
              description:
                'When the task failed (only present when status is failed)',
            },
          },
          required: ['id', 'type', 'input', 'status', 'createdAt', 'updatedAt'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Invalid input. Please provide a non-negative integer.',
              description: 'Error message describing what went wrong',
            },
          },
          required: ['message'],
        },
      },
    },
  },
  apis: [
    './src/routes/**/*.ts',
    './src/controllers/**/*.ts',
    '!./src/**/__tests__/**',
    '!./src/**/*.test.ts',
    '!./src/**/*.spec.ts',
  ], // Path to files with OpenAPI annotations, excluding test files
};

// Generate swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Try to load auto-generated swagger.json if it exists
let autoGenSwagger = null;
try {
  const swaggerPath = resolve('./src/swagger/swagger.json');
  const swaggerFile = readFileSync(swaggerPath, 'utf-8');
  autoGenSwagger = JSON.parse(swaggerFile);
} catch (error) {
  console.log(
    'ℹ️ Auto-generated swagger.json not found, using JSDoc annotations only'
  );
}

// Merge manual and auto-generated specs (auto-gen takes precedence for paths)
const finalSpec = autoGenSwagger
  ? {
      ...swaggerSpec,
      paths: {
        ...(swaggerSpec as any).paths,
        ...autoGenSwagger.paths,
      },
    }
  : swaggerSpec;

export function setupSwagger(app: Application): void {
  // Swagger UI options
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        req.headers['Content-Type'] = 'application/json';
        return req;
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
    `,
    customSiteTitle: 'Media Prototype API Docs',
  };

  // Serve swagger.json
  app.get('/api-docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(finalSpec);
  });

  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(finalSpec, swaggerUiOptions));

  console.log(
    '📚 Swagger documentation available at: http://localhost:3000/api-docs'
  );
}

export { swaggerSpec };
