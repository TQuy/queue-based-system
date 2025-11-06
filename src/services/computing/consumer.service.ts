import { COMPUTING_QUEUE } from '@/constants/computing';
import { rabbitMQService } from '../queue/rabbitmq.service';

class ConsumerService {
  async consume(): Promise<void> {
    const channel = await rabbitMQService.getConsumerChannel()!;
    channel.assertQueue(COMPUTING_QUEUE, { durable: true });
    channel.consume(COMPUTING_QUEUE, async msg => {
      console.log('msg: ', msg);
    });
  }
}

const consumerService = new ConsumerService();
export { consumerService };
export default ConsumerService;
