import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from "@/constants/computing.js";
import { dataStoreServiceManager } from "@/services/datastore/datastore.service.js";
import { WebsocketService } from "@/services/websocket/websocket.service.js";
import { DatastoreService } from "@/types/datastore.js";
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
            const updateTaskStatus = async () => {
                if (success) {
                    this.dataStoreService.updateTask(msg.taskId, { status: 'completed', result: result });
                } else {
                    this.dataStoreService.updateTask(msg.taskId, { status: 'failed' });
                }
            }
            const replyThroughWebSocket = async () => {
                const taskData = await this.dataStoreService.getTask(msg.taskId);
                if (taskData) {
                    await WebsocketService.replyWithResult(
                        taskData,
                        success ? FIBONACCI_WS_COMPLETE_EVENT : FIBONACCI_WS_FAILED_EVENT
                    );
                }
            }
            await Promise.all([
                updateTaskStatus(),
                replyThroughWebSocket(),
            ])
        }
    }
}
