import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from "@/constants/computing.js";
import { WebsocketService } from "@/services/websocket/websocket.service.js";
import { DatastoreService, TaskData } from "@/types/datastore.js";
import { MessageData } from "@/types/queue.js";
import { fibonacciWorkerService } from "@/workers/computing/fibonacciWorker.service.js";

export class FibonacciConsumerService {
    constructor(private dataStoreService: DatastoreService) { }

    async consume(
        msg: MessageData,
    ) {
        let success = false;
        let result: number = 0;
        try {
            result = await fibonacciWorkerService.consume(
                msg.data
            );
            success = true;
            console.log(`Fibonacci task consumed with result: ${result}`);
        } finally {
            const taskData = await this.dataStoreService.getTask(msg.taskId);
            if (!taskData) {
                console.warn(`Task data not found for Task ID ${msg.taskId}`);
                return;
            }
            const updatedTaskData = {
                ...taskData,
                result: result,
                status: success ? 'completed' : 'failed',
            } as TaskData;
            await this.dataStoreService.updateTask(msg.taskId, updatedTaskData);
            await WebsocketService.replyWithResult(
                updatedTaskData,
                success ? FIBONACCI_WS_COMPLETE_EVENT : FIBONACCI_WS_FAILED_EVENT
            );
        }
    }
}
