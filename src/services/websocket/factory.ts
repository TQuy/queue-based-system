import { DatastoreService, TaskData } from "@/types/datastore.js";
import { Socket } from "socket.io";
import { WebsocketService } from "@/services/websocket/websocket.service.js";

export async function taskCommunicationFactory(
    taskData: TaskData,
    socket: Socket,
    dataStoreService: DatastoreService
): Promise<void> {
    switch (taskData.type) {
        case 'fibonacci:calculate':
            await WebsocketService.handleCommunicationFibonacciTask(socket, taskData, dataStoreService);
            break;
        default:
            throw new Error(`[socket.io] No handler for task type: ${taskData.type}`);
    }
}