import swaggerAutogen from 'swagger-autogen';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const doc = {
  info: {
    title: 'Media Prototype API',
    description: 'TypeScript Express.js API with auto-generated documentation',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC',
    },
  },
  host: 'localhost:3000',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Computing',
      description: 'Mathematical computation endpoints',
    },
    {
      name: 'Fibonacci',
      description: 'Fibonacci number calculations',
    },
  ],
  definitions: {
    HealthResponse: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
        },
      },
    },
    FibonacciResponse: {
      type: 'object',
      properties: {
        input: {
          type: 'integer',
          example: 10,
        },
        fibonacci: {
          type: 'integer',
          example: 55,
        },
      },
    },
    FibonacciSequenceResponse: {
      type: 'object',
      properties: {
        count: {
          type: 'integer',
          example: 5,
        },
        sequence: {
          type: 'array',
          items: {
            type: 'integer',
          },
          example: [0, 1, 1, 2, 3],
        },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          example: 'Invalid input. Please provide a non-negative integer.',
        },
      },
    },
  },
};

// Ensure output directory exists
const outputDir = join(__dirname, '../docs');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const outputFile = join(outputDir, 'swagger.json');
const endpointsFiles = [
  join(__dirname, '../src/index.ts'),
  join(__dirname, '../src/routes/**/*.ts'),
];

const options = {
  openapi: '3.0.0',
  language: 'en-US',
  disableLogs: false,
  autoHeaders: false,
  autoQuery: false,
  autoBody: false,
};

console.log('🔄 Generating Swagger documentation...');
console.log('📁 Output file:', outputFile);
console.log('📂 Scanning files:', endpointsFiles);

// Generate swagger documentation
swaggerAutogen(options)(outputFile, endpointsFiles, doc)
  .then(result => {
    if (result && result.success !== false) {
      console.log('✅ Swagger documentation generated successfully!');
      console.log('📄 File created:', outputFile);
    } else {
      console.error('❌ Swagger generation failed');
      process.exit(1);
    }
  })
  .catch((error: unknown) => {
    console.error('❌ Error generating swagger documentation:', error);
    process.exit(1);
  });
