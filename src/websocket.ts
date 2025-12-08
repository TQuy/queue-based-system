import type { Application } from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { DatastoreService } from '@/types/index.js';
import { taskCommunicationFactory } from '@/services/websocket/factory.js';
import { websocketManager } from '@/services/websocket/websocketManager.service.js';


export function setupSocketServer(
    app: Application,
    dataStoreService: DatastoreService
) {
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
    io.on('connection', (socket) => {
        console.log(`[socket.io] User connected: ${socket.id}`);
        const taskId = socket.handshake.query.taskId as string;
        if (taskId) {
            // response with task info
            dataStoreService.getTask(taskId).then(async (taskData) => {
                if (taskData) {
                    console.log(`[socket.io] TaskData associated with taskId ${taskId}: ${JSON.stringify(taskData)}`)
                    await taskCommunicationFactory(taskData, socket, dataStoreService);
                }
            });
        }

        // Handle a disconnection event
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });

        // Listen for a custom event from the client
        socket.on('chat message', (msg: string) => {
            console.log(`[socket.io] message from ${socket.id}: ${msg}`);
            // Broadcast the message to everyone
            io.emit('chat message', msg);
        });
    });

    // Exported reference for other modules to use
    websocketManager.setIOInstance(io);

    return { httpServer, io };
}
