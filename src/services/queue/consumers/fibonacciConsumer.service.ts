import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from "@/constants/computing.js";
import { queueTypes } from "@/constants/queue.js";
import { WebsocketService } from "@/services/websocket/websocket.service.js";
import { DatastoreService, TaskData } from "@/types/datastore.js";
import { MessageData, QueueTypes } from "@/types/queue.js";
import { fibonacciWorkerService } from "@/workers/computing/fibonacciWorker.service.js";

export class FibonacciConsumerService {
    constructor(private dataStoreService: DatastoreService) { }

    async consume(
        msg: MessageData,
        queueType: QueueTypes
    ) {
        let success = false;
        let result: number = 0;
        try {
            if (queueType === queueTypes.RESPONSE) {
                result = msg.data.result;
            } else {
                result = await fibonacciWorkerService.consume(
                    msg.data
                );
            }
            success = true;
            console.log(`Fibonacci task consumed with result: ${result}`);
        } finally {
            const taskData = await this.dataStoreService.getTask(msg.taskId);
            if (!taskData) {
                console.warn(`Task data not found for Task ID ${msg.taskId}`);
                return;
            }
            if (taskData.status !== 'completed' && taskData.status !== 'failed') {
                const updatedTaskData = {
                    ...taskData,
                    result: result,
                    status: success ? 'completed' : 'failed',
                } as TaskData;
                await this.dataStoreService.updateTask(msg.taskId, updatedTaskData);
                // Only emit if socketId is already set (client connected before task completed)
                if (taskData.socketId) {
                    await WebsocketService.replyWithResult(
                        updatedTaskData,
                        success ? FIBONACCI_WS_COMPLETE_EVENT : FIBONACCI_WS_FAILED_EVENT
                    );
                    console.log(`WebSocket result emitted for task ${msg.taskId} to socket ${taskData.socketId}`);
                } else {
                    console.log(`No socketId set for task ${msg.taskId}; result will be sent when client connects`);
                }
            } else {
                // Task already completed; only emit if socketId is present
                if (taskData.socketId) {
                    await WebsocketService.replyWithResult(
                        taskData,
                        success ? FIBONACCI_WS_COMPLETE_EVENT : FIBONACCI_WS_FAILED_EVENT
                    );
                }
            }
        }
    }
}
