import { fibonacciConsumerService } from '@/services/queue/consumer/fibonacciConsumer.service.js';
import { redisService } from '@/services/datastore/redis.service.js';
import { FIBONACCI_WS_COMPLETE_EVENT, FIBONACCI_WS_FAILED_EVENT } from '@/constants/computing.js';
import { WebsocketService } from '@/services/websocket/websocket.service.js';

export const consumerFactory = async (msg: {
  topic: string;
  data: any;
  taskId: string;
}): Promise<boolean> => {
  console.log('Received message with topic:', msg.topic);
  const parts = msg.topic.split(':');
  if (!parts.length) throw new Error('Empty topic');
  switch (parts[0]) {
    case 'fibonacci': {
      if (parts[1] === 'calculate') {
        let success = false;
        let result: number = 0;
        try {
          result = await fibonacciConsumerService.consume(
            msg.data
          );
          success = true;
          console.log(`Fibonacci task consumed with result: ${result}`);
        } finally {
          const updateTaskStatus = async () => {
            if (success) {
              redisService.updateTask(msg.taskId, { status: 'completed', result: result });
            } else {
              redisService.updateTaskStatus(msg.taskId, 'failed');
            }
          }
          const replyThroughWebSocket = async () => {
            const taskData = await redisService.getTask(msg.taskId);
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
      break;
    }
    default: {
      throw new Error(`No consumer found for topic prefix: ${parts[0]}`);
    }
  }
  return true;
};
