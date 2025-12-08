import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createApp } from '@/app.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { consumerFactory } from '@/services/queue/consumer.service.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { setupSocketServer } from '@/websocket.js';
import { MessageBrokerService } from './types/queue.js';
import { DatastoreService } from './types/datastore.js';

// Get the current working directory (where you run the command)
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, 'config/.env') });

export async function setupMessageBroker(
  messageBrokerService: MessageBrokerService,
  dataStoreService: DatastoreService
) {
  // Test RabbitMQ connection (only in development)
  if (process.env['NODE_ENV'] !== 'production') {
    console.log('[TEST][AMQP] Running RabbitMQ connectivity test...');
    const messageContent = { text: 'Hello, RabbitMQ!' };

    await messageBrokerService.sendMessage('test_queue', messageContent);

    messageBrokerService.startConsumer(
      'test_queue',
      async (msg: any): Promise<boolean> => {
        if (msg && JSON.stringify(msg) === JSON.stringify(messageContent)) {
          console.log('[TEST][AMQP] RabbitMQ test successful:', msg);

          // Clean up test queue after successful test
          await messageBrokerService.cleanup(['test_queue']);
          console.log('[TEST][AMQP] 🧹 Test queue cleaned up');
          await messageBrokerService.startConsumer(
            'computing_queue',
            (msg: any) => consumerFactory(dataStoreService!, msg)
          );

          return true;
        } else if (msg) {
          console.log('[TEST][AMQP] ⚠️ Unexpected message:', msg);
        } else {
          console.log('[TEST][AMQP] No message received');
        }
        return false;
      }
    );
  }
}

export async function startServer() {
  const {
    app,
    dataStore: dataStoreService,
    messageBroker: messageBrokerService,
  } = createApp(redisService, rabbitMQService);
  const port: number =
    (process.env['PORT'] && parseInt(process.env['PORT'])) || 3000;
  await messageBrokerService.connect();
  await dataStoreService.connect();

  // Setup Socket.IO with the Express app
  const { httpServer } = setupSocketServer(app, dataStoreService);

  httpServer.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};

const currentFilePath = fileURLToPath(import.meta.url);

// 2. Get the absolute path of the file that started the Node.js process.
// process.argv[1] is the path passed to the 'node' command.
const mainFilePath = path.resolve(process.argv[1] as string);

/**
 * Checks if the current module is the main entry point.
 * This is the functional equivalent of Python's if __name__ == '__main__'.
 */
const isMainModule = currentFilePath === mainFilePath;

if (isMainModule) {
  console.log('✅ File executed directly. Starting server...');
  startServer();
} else {
  console.log('📦 File imported as a module. Skipping startup code.');
  Promise.resolve(createApp(redisService, rabbitMQService).app);
}