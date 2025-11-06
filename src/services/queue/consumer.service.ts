import { fibonacciConsumerService } from '../computing/fibonacciConsumer.service';

export const consumerFactory = async (msg: { topic: string; data: any }) => {
  console.log('Received message with topic:', msg.topic);
  const parts = msg.topic.split('.');
  if (!parts.length) throw new Error('Empty topic');
  switch (parts[0]) {
    case 'fibonacci': {
      if (parts[1] === 'calculate') {
        const result = await fibonacciConsumerService.consume(msg.data);
        console.log(`Fibonacci calculation result: ${result}`);
        return true;
      }
      break;
    }
    default: {
      throw new Error(`No consumer found for topic prefix: ${parts[0]}`);
    }
  }
  return false;
};
