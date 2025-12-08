import request from 'supertest';
import * as dotenv from 'dotenv';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { io } from 'socket.io-client';
import { type Application } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { createApp } from '@/app.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from '@/constants/computing.js';
import { setupSocketServer } from '@/websocket.js';
import { DatastoreService } from '@/types/datastore.js';
import { MessageBrokerService } from '@/types/queue.js';
import { setupMessageBroker } from '@/index.js';
// ...existing code...

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, 'config/.env') });
describe('Fibonacci Routes E2E Tests', () => {
    let app: Application;
    let dataStoreService: DatastoreService;
    let messageBrokerService: MessageBrokerService;
    let httpServer: http.Server;
    let socketIoServer: IOServer;
    let serverUrl: string;

    beforeAll(async () => {
        // Initialize app and services
        try {
            ({ app, dataStore: dataStoreService, messageBroker: messageBrokerService } = createApp(redisService, rabbitMQService));
            await dataStoreService.connect();
            await messageBrokerService.connect();
            ({ httpServer, io: socketIoServer } = setupSocketServer(app, dataStoreService));
            await setupMessageBroker(
                messageBrokerService,
                dataStoreService
            );

            // Listen on ephemeral port
            await new Promise<void>((resolve) => httpServer.listen(0, resolve));
            const addr = httpServer.address();
            const port = typeof addr === 'object' && addr?.port ? addr.port : 3000;
            serverUrl = `http://localhost:${port}`;

            console.log('✅ Services & test Socket.IO server started', serverUrl);
        } catch (error) {
            console.warn('⚠️  Failed to connect to Redis/RabbitMQ or start test socket server:', error);
            // Continue anyway for tests that don't require external services
        }
    }, 30000);

    afterAll(async () => {
        try {
            // Close Socket.IO and HTTP server
            if (socketIoServer) await socketIoServer.close();

            // Disconnect datastore (which should be redisService)
            await dataStoreService.disconnect();
            // Clean up message broker
            await messageBrokerService.cleanup([], true);

            // Give time for all async operations to settle
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(new Error('⚠️  Failed to disconnect services or stop test server:', { cause: error }));
        }
    }, 30000);

    // ...existing tests...

    // Replace the original websocket polling test body with this implementation
    it('should be able to poll for result of scheduled fibonacci task', async () => {
        const input = 7;

        // Schedule the task
        const scheduleResponse = await request(app)
            .post('/api/computing/fibonacci/schedule')
            .send({ n: input })
            .expect(StatusCodes.ACCEPTED);
        const taskId = scheduleResponse.body.taskId;
        expect(taskId).toBeDefined();

        // Connect socket.io-client to the test server and pass taskId as query
        const connectionOptions = {
            query: { taskId },
            transports: ['websocket'],
        };
        const clientSocket = io(serverUrl, connectionOptions);
        // Wait for client to connect
        await new Promise<void>((resolve, reject) => {
            clientSocket.on('connect', () => {
                console.log('[socket.io] Client connected to test Socket.IO server');
                resolve();
            });
            clientSocket.on('disconnect', () => {
                console.log('[socket.io] Client disconnected');
            });
            clientSocket.on('connect_error', (err: any) => {
                reject(err);
            });
        });

        // Prepare a promise that resolves when the client receives the event
        const received = new Promise<any>((resolve, reject) => {
            clientSocket.on(FIBONACCI_WS_COMPLETE_EVENT, (data: any) => {
                console.log('[socket.io] Client received complete event:', data);
                resolve(data);
            });

            clientSocket.on(FIBONACCI_WS_FAILED_EVENT, (data: any) => {
                console.log('[socket.io] Client received failed event:', data);
                reject(new Error(`Received failed event: ${JSON.stringify(data)}`));
            });
        });

        // Emit from the test-side Socket.IO server to that socketId
        const expectedResult = 13; // F(7)

        const data = await received;
        console.log('[socket.io] Test received data from websocket:', data);
        expect(data).toBeDefined();
        expect(data.taskId).toBe(taskId);
        expect(data.result).toBe(expectedResult);

        // Cleanup client
        clientSocket.disconnect();
    }, 30000);
});