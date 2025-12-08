import { Socket } from "socket.io";
import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from "@/constants/computing.js";
import { DatastoreService, TaskData } from "@/types/index.js";
import { isTaskCompleted, isTaskFailed } from "@/utils/datastore/datastore.utils.js";
import { websocketManager } from "@/services/websocket/websocketManager.service.js";

export class WebsocketService {
    /**Use websocket to return the result data */
    static async replyWithResult(
        data: TaskData,
        event: string,
    ) {
        const socketId = data.socketId;
        if (!socketId) {
            console.log(`No socketId found for task ${data.id}`);
            return;
        }
        const io = websocketManager.getIOInstance();
        io.to(socketId).emit(event, {
            taskId: data.id,
            result: data.result
        });
        console.log(`Sent result ${data.result} for Task ID ${data.id} to client ${socketId}`);
    }

    static async handleCommunicationFibonacciTask(
        socket: Socket,
        taskData: TaskData,
        dataStoreService: DatastoreService
    ): Promise<void> {
        if (isTaskCompleted(taskData)) {
            // If task already completed, send result immediately
            await WebsocketService.replyWithResult(
                {
                    ...taskData,
                    socketId: socket.id
                },
                FIBONACCI_WS_COMPLETE_EVENT
            );
        } else if (isTaskFailed(taskData)) {
            await WebsocketService.replyWithResult(
                {
                    ...taskData,
                    socketId: socket.id
                },
                FIBONACCI_WS_FAILED_EVENT
            );
        }
        else {
            // assign socketId to task for future response
            await dataStoreService.updateTask(taskData.id, { socketId: socket.id });
        }
    }
}
