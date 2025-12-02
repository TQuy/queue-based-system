import { createServer } from 'node:http';
import type { Application } from 'express';
import { Server, Socket } from 'socket.io';
import { redisService } from './services/datastore/redis.service.js';
import { TaskData } from './services/datastore/types.js';
import * as wsService from '@/services/websocket/websocket.service.js';
import { FIBONACCI_WS_COMPLETE_EVENT } from './constants/computing.js';
import { isTaskCompleted } from './utils/datastore/datastore.utils.js';


export function setupSocketServer(app: Application) {
    // Create an HTTP server from the Express app
    const httpServer = createServer(app);

    // Attach Socket.IO to the HTTP server
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Basic connection event handler
    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.id}`);
        const taskId = socket.handshake.query.taskId as string;
        if (taskId) {
            const taskData = await redisService.getTask(taskId);
            if (taskData) {
                console.log(`TaskData associated with taskId ${taskId}: ${JSON.stringify(taskData)}`)
                await taskCommunicationFactory(taskData, socket);
            }
        }

        // Handle a disconnection event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });

        // Listen for a custom event from the client
        socket.on('chat message', (msg: string) => {
            console.log(`message from ${socket.id}: ${msg}`);
            // Broadcast the message to everyone
            io.emit('chat message', msg);
        });
    });

    return { httpServer, io };
}

async function taskCommunicationFactory(taskData: TaskData, socket: Socket) {
    switch (taskData.type) {
        case 'fibonacci:calculate':
            await handleCommunicationFibonacciTask(socket, taskData);
            break;
        default:
            throw new Error(`No handler for task type: ${taskData.type}`);
    }
}

async function handleCommunicationFibonacciTask(socket: Socket, taskData: TaskData): Promise<void> {
    if (isTaskCompleted(taskData)) {
        // If task already completed, send result immediately
        await wsService.replyWithResult(
            {
                ...taskData,
                socketId: socket.id
            },
            FIBONACCI_WS_COMPLETE_EVENT
        );
    } else {
        // assign socketId to task for future response
        redisService.updateTask(taskData.id, { socketId: socket.id });
    }
}