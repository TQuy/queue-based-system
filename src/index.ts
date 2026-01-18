import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createApp } from '@/app.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { consumerFactory } from '@/services/queue/consumer.service.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { setupSocketServer } from '@/websocket.js';
import { MessageBrokerService } from '@/types/queue.js';
import { DatastoreService } from '@/types/datastore.js';
import { COMPUTING_QUEUE, RESPONSE_QUEUE } from '@/constants/computing.js';
import { queueTypes } from '@/constants/queue.js';
import { isWorkerDecoupled } from '@/utils/environment.utils.js';

// Get the current working directory (where you run the command)
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, 'config/.env') });

export async function setupMessageBroker(
  messageBrokerService: MessageBrokerService,
  dataStoreService: DatastoreService
) {
  console.log(`[ENV] isWorkerDecoupled(): ${isWorkerDecoupled()}`)
  if (isWorkerDecoupled()) {
    console.log('[AMQP] Setting up response consumer for decoupled workers...');
    await messageBrokerService.startResponseConsumer(
      RESPONSE_QUEUE,
      (msg: any) => consumerFactory(dataStoreService!, msg, queueTypes.RESPONSE)
    )
  } else {
    console.log('[AMQP] Setting up consumer for coupled workers...');
    await messageBrokerService.startConsumer(
      COMPUTING_QUEUE,
      (msg: any) => consumerFactory(dataStoreService!, msg, queueTypes.EXECUTE)
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
  setupMessageBroker(messageBrokerService, dataStoreService);
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