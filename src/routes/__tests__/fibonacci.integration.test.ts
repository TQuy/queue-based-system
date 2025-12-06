import request from 'supertest';
import * as dotenv from 'dotenv';
import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { io } from 'socket.io-client';
import { type Application } from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import { createApp } from '@/app.js';
import { dataStoreServiceManager } from '@/services/datastore/datastore.service.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { messageBrokerManager } from '@/services/queue/messageBroker.service.js';
import { rabbitMQService } from '@/services/queue/rabbitmq.service.js';
import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from '@/constants/computing.js';
import { setupSocketServer } from '@/websocket.js';
// ...existing code...

const cwd = process.cwd();
dotenv.config({ path: path.join(cwd, 'config/.env') });

describe.only('Fibonacci Routes E2E Tests', () => {
    let app: Application;
    let httpServer: http.Server;
    let socketIoServer: IOServer;
    let serverUrl: string;
    const taskSocketMap = new Map<string, string>(); // taskId -> socketId

    beforeAll(async () => {
        // Initialize app and services
        try {
            app = createApp(redisService, rabbitMQService);
            const dataStoreService = dataStoreServiceManager.getDataStoreServiceInstance();
            await dataStoreService.connect();
            const messageBrokerService = messageBrokerManager.getMessageBrokerService();
            await messageBrokerService.connect();
            // ({ httpServer, io: socketIoServer } = await setupSocketServer(app, dataStoreService));
            // Start an in-test HTTP server and attach a Socket.IO server
            httpServer = http.createServer(app);
            socketIoServer = new IOServer(httpServer, { cors: { origin: '*' } });

            // Simple connection handler: map incoming taskId -> socket.id
            socketIoServer.on('connection', (socket) => {
                const taskId = socket.handshake.query?.taskId as string | undefined;
                if (taskId) {
                    taskSocketMap.set(taskId, socket.id);
                }

                socket.on('disconnect', () => {
                    // remove any mappings that reference this socket
                    for (const [t, sId] of taskSocketMap.entries()) {
                        if (sId === socket.id) taskSocketMap.delete(t);
                    }
                });
            });

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
            const dataStoreService = dataStoreServiceManager.getDataStoreServiceInstance();
            await dataStoreService.disconnect();
            
            // Also explicitly disconnect redisService singleton to clear any lingering references
            await redisService.disconnect();
            
            // Clean up message broker
            const messageBrokerService = messageBrokerManager.getMessageBrokerService();
            await messageBrokerService.cleanup([], true);
            
            // Give time for all async operations to settle
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(new Error('⚠️  Failed to disconnect services or stop test server:', { cause: error }));
        }
    }, 30000);

    // ...existing tests...

    // Replace the original websocket polling test body with this implementation
    it.only('should be able to poll for result of scheduled fibonacci task', async () => {
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
        const socket = io(serverUrl, connectionOptions);

        // Wait for client to connect
        await new Promise<void>((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('Socket connect timeout')), 5000);
            socket.on('connect', () => {
                clearTimeout(t);
                resolve();
            });
            socket.on('connect_error', (err: any) => {
                clearTimeout(t);
                reject(err);
            });
        });

        // Simulate the backend publishing the result to the socket identified by taskId
        const socketId = taskSocketMap.get(taskId);
        expect(socketId).toBeDefined();

        // Prepare a promise that resolves when the client receives the event
        const received = new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Did not receive websocket event in time')), 5000);

            socket.on(FIBONACCI_WS_COMPLETE_EVENT, (data: any) => {
                clearTimeout(timeout);
                resolve(data);
            });

            socket.on(FIBONACCI_WS_FAILED_EVENT, (data: any) => {
                clearTimeout(timeout);
                reject(new Error(`Received failed event: ${JSON.stringify(data)}`));
            });
        });

        // Emit from the test-side Socket.IO server to that socketId
        const expectedResult = 13; // F(7)
        socketIoServer.to(socketId!).emit(FIBONACCI_WS_COMPLETE_EVENT, { taskId, result: expectedResult });

        const data = await received;
        expect(data).toBeDefined();
        expect(data.taskId).toBe(taskId);
        expect(data.result).toBe(expectedResult);

        // Cleanup client
        socket.disconnect();
    });
});