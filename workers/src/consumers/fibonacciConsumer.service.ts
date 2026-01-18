import { FIBONACCI_DATA_TYPE, RESPONSE_QUEUE } from "@/constants/computing.js";
import { DatastoreService, TaskData } from "@/types/datastore.js";
import { FibonacciMessageData, MessageBrokerService } from "@/types/queue.js";
import { FibonacciWorkerService } from "@/workers/computing/fibonacciWorker.service.js";

export class FibonacciConsumerService {
    constructor(
        private dataStoreService: DatastoreService,
        private messageBrokerService: MessageBrokerService
    ) { }

    async consume(
        msg: FibonacciMessageData,
    ) {
        let success = false;
        let result: number = 0;
        try {
            result = await FibonacciWorkerService.consume(
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
            await this.messageBrokerService.sendMessage(
                RESPONSE_QUEUE,
                {
                    topic: FIBONACCI_DATA_TYPE,
                    taskId: msg.taskId,
                    data: updatedTaskData,
                }
            )
        }
    }
}
