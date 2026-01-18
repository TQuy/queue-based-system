import path from "node:path"
import { fileURLToPath } from "node:url";
import { dataStoreServiceManager } from "@/datastore/datastore.service.js";
import { redisService } from "@/datastore/redis.service.js";
import { messageBrokerManager } from "@/messagebroker/messageBroker.service.js";
import { rabbitMQService } from "@/messagebroker/rabbitmq.service.js";
import { consumerFactory } from "@/consumers/consumerFactory.js";
import dotenv from "dotenv";
import { COMPUTING_QUEUE } from "./constants/computing.js";

// Load .env for tests
const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, '..', 'config/.env') });

async function startServer() {
    dataStoreServiceManager.setDataStoreServiceInstance(redisService)
    messageBrokerManager.setMessageBroker(rabbitMQService);
    const dataStoreService = dataStoreServiceManager.getDataStoreServiceInstance();
    const messageBrokerService = messageBrokerManager.getMessageBrokerService();
    await messageBrokerService.startConsumer(
        COMPUTING_QUEUE,
        (msg: any) => consumerFactory(dataStoreService, messageBrokerService, msg)
    )
    await messageBrokerService.connect();
    await dataStoreService.connect();
}

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
}