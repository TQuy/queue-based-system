import { DatastoreService } from '@/types/datastore.js';
import { MessageData } from '@/types/queue.js';
import { FibonacciConsumerService } from './consumers/fibonacciConsumer.service.js';

export async function consumerFactory(
  dataStoreService: DatastoreService,
  msg: MessageData,
): Promise<boolean> {
  console.log('Received message with topic:', msg.topic);
  const parts = msg.topic.split(':');
  if (!parts.length) throw new Error('Empty topic');
  switch (parts[0]) {
    case 'fibonacci': {
      if (parts[1] === 'calculate') {
        const fibonacciConsumerService = new FibonacciConsumerService(dataStoreService);
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
