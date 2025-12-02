import dotenv from 'dotenv';
import path from 'path';
import { createApp } from '@/app.js';
import type { Server as SocketIOServer } from 'socket.io';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { consumerFactory } from '@/services/queue/consumer.service.js';
import { redisService } from './services/datastore/redis.service.js';
import { setupSocketServer } from './websocket.js';

// Get the current working directory (where you run the command)
const cwd = process.cwd();

dotenv.config({ path: path.join(cwd, 'config/.env') });

const startServer = async () => {
  const app = createApp();
  const port: number =
    (process.env['PORT'] && parseInt(process.env['PORT'])) || 3000;
  await rabbitMQService.connect();
  await redisService.connect();

  // Setup Socket.IO with the Express app
  const { io: socketIo, httpServer } = setupSocketServer(app);

  // Exported reference for other modules to use
  exportedIo = socketIo;

  httpServer.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
  });

  // Test RabbitMQ connection (only in development)
  if (process.env['NODE_ENV'] !== 'production') {
    console.log('[TEST][AMQP] Running RabbitMQ connectivity test...');
    const messageContent = { text: 'Hello, RabbitMQ!' };

    await rabbitMQService.sendMessage('test_queue', messageContent);

    rabbitMQService.startConsumer(
      'test_queue',
      async (msg: any): Promise<boolean> => {
        if (msg && JSON.stringify(msg) === JSON.stringify(messageContent)) {
          console.log('[TEST][AMQP] RabbitMQ test successful:', msg);

          // Clean up test queue after successful test
          await rabbitMQService.cleanup(['test_queue']);
          console.log('[TEST][AMQP] 🧹 Test queue cleaned up');
          await rabbitMQService.startConsumer(
            'computing_queue',
            consumerFactory
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

  return app;
};

/**
 * Exported socket.io instance. Modules that need to emit events can import
 * this variable but should call `getIO()` to ensure it's initialized.
 */
export let exportedIo: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!exportedIo) throw new Error('Socket.IO not initialized yet');
  return exportedIo;
}

const server = startServer();
export default server;
