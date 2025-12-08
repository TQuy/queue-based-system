import type { Server as SocketIOServer } from 'socket.io';

export class WebsocketManager {
    private ioInstance: SocketIOServer | null = null;
    constructor() { }

    setIOInstance(io: SocketIOServer): void {
        this.ioInstance = io;
    }

    getIOInstance(): SocketIOServer {
        if (!this.ioInstance) {
            throw new Error('Socket.IO instance not initialized yet');
        }
        return this.ioInstance;
    }
}

export const websocketManager = new WebsocketManager();