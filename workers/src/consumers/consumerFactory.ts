import { DatastoreService } from '@/types/datastore.js';
import { MessageBrokerService, MessageData } from '@/types/queue.js';
import { FibonacciConsumerService } from '@/consumers/fibonacciConsumer.service.js';

export async function consumerFactory(
  dataStoreService: DatastoreService,
  messageBrokerManager: MessageBrokerService,
  msg: MessageData,
): Promise<boolean> {
  const parts = msg.topic.split(':');
  if (!parts.length) throw new Error('Empty topic');
  switch (parts[0]) {
    case 'fibonacci': {
      if (parts[1] === 'calculate') {
        const fibonacciConsumerService = new FibonacciConsumerService(dataStoreService, messageBrokerManager);
        await fibonacciConsumerService.consume(msg);
      }
      break;
    }
    default: {
      throw new Error(`No consumer found for topic prefix: ${parts[0]}`);
    }
  }
  return true;
};
