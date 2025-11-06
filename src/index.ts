import { createApp } from '@/app';
import dotenv from 'dotenv';
import { rabbitMQService } from '@/services/queue/rabbitmq.service';
import path from 'path';

// Get the current working directory (where you run the command)
const cwd = process.cwd();

dotenv.config({ path: path.join(cwd, 'config/.env') });

const startServer = async () => {
  const app = createApp();
  const port: number =
    (process.env['PORT'] && parseInt(process.env['PORT'])) || 3000;
  await rabbitMQService.connect();

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  // Test RabbitMQ connection (only in development)
  if (process.env['NODE_ENV'] !== 'production') {
    console.log('[TEST] Running RabbitMQ connectivity test...');
    const messageContent = { text: 'Hello, RabbitMQ!' };

    await rabbitMQService.sendMessage('test_queue', messageContent);

    rabbitMQService.startConsumer(
      'test_queue',
      async (msg: any): Promise<boolean> => {
        if (msg && JSON.stringify(msg) === JSON.stringify(messageContent)) {
          console.log('[TEST] ✅ RabbitMQ test successful:', msg);

          // Clean up test queue after successful test
          setTimeout(async () => {
            await rabbitMQService.cleanup(['test_queue']);
            console.log('[TEST] 🧹 Test queue cleaned up');
          }, 1000);

          return true;
        } else if (msg) {
          console.log('[TEST] ⚠️ Unexpected message:', msg);
        } else {
          console.log('[TEST] ❌ No message received');
        }
        return false;
      }
    );
  }

  return app;
};

const server = startServer();
export default server;
