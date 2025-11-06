import type { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import { connect } from 'amqplib';

/**
 * A production-ready RabbitMQ service that manages a single connection
 * but uses separate channels for publishing and consuming to improve
 * fault tolerance.
 */
class RabbitMQService {
  private conn: ChannelModel | null = null;
  private publishChannel: Channel | null = null;
  private consumeChannel: Channel | null = null;

  private static instance: RabbitMQService;

  // Private constructor for singleton
  private constructor() {}

  /**
   * Gets the singleton instance of the RabbitMQService.
   */
  public static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  /**
   * Connects to the RabbitMQ server and creates separate channels
   * for publishing and consuming.
   */
  async connect(): Promise<void> {
    try {
      const amqpUrl = `${process.env['RABBITMQ_PROTOCOL'] || 'amqp'}://${process.env['RABBITMQ_USERNAME']}:${process.env['RABBITMQ_PASSWORD']}@${process.env['RABBITMQ_HOST'] || 'localhost'}:${process.env['RABBITMQ_PORT'] || 5672}`;
      console.log(`[AMQP] Connecting to RabbitMQ at ${amqpUrl}`);
      this.conn = await connect(amqpUrl);
      console.log('[AMQP] RabbitMQ connection established');

      // Handle connection errors
      this.conn.on('error', err => {
        console.error('[AMQP] conn error', err.message);
        // Implement reconnection logic here
        this.conn = null;
      });
      this.conn.on('close', () => {
        console.warn('[AMQP] RabbitMQ connection closed. Reconnecting...');
        this.conn = null;
        setTimeout(() => this.connect(), 5000); // Reconnect after 5s
      });

      // 2. Create a dedicated channel for PUBLISHING
      this.publishChannel = await this.conn.createChannel();
      console.log('[AMQP] Publish channel created');

      // Handle publish channel errors
      this.publishChannel.on('error', err => {
        console.error('[AMQP] publish channel error', err.message);
      });
      this.publishChannel.on('close', () => {
        console.warn('[AMQP] Publish channel closed.');
        this.publishChannel = null;
        // Re-create if connection is still active
      });

      // 3. Create a dedicated channel for CONSUMING
      this.consumeChannel = await this.conn.createChannel();
      console.log('[AMQP] Consume channel created');

      // Handle consume channel errors
      this.consumeChannel.on('error', err => {
        console.error('[AMQP] consume channel error', err.message);
      });
      this.consumeChannel.on('close', () => {
        console.warn('[AMQP] Consume channel closed.');
        this.consumeChannel = null;
        // Re-create if connection is still active and re-subscribe consumers
      });
    } catch (err) {
      console.error('[AMQP] Failed to connect to RabbitMQ', err);
      // Retry connection after a delay
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Sends a message to a specific queue using the dedicated publish channel.
   */
  async sendMessage(queue: string, message: any): Promise<boolean> {
    if (!this.publishChannel) {
      console.error('[AMQP] No publish channel found. Is service connected?');
      return false;
    }

    try {
      // Assert the queue
      await this.publishChannel.assertQueue(queue, { durable: true });

      // Send the message
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.publishChannel.sendToQueue(queue, messageBuffer, {
        persistent: true,
      });

      console.log(`[AMQP] Message sent to queue '${queue}'`);
      return true;
    } catch (err) {
      console.error(`[AMQP] Failed to send message to queue '${queue}'`, err);
      // Handle error, maybe re-create channel
      return false;
    }
  }

  /**
   * Starts a consumer for a specific queue using the dedicated consume channel.
   */
  async startConsumer(
    queue: string,
    onMessage: (msg: any) => Promise<boolean>
  ) {
    if (!this.consumeChannel) {
      console.error('[AMQP] No consume channel found. Is service connected?');
      // Retry, as channel might be reconnecting
      setTimeout(() => this.startConsumer(queue, onMessage), 5000);
      return;
    }

    try {
      // 1. Assert the queue
      await this.consumeChannel.assertQueue(queue, { durable: true });

      // 2. Set prefetch to 1. This ensures the consumer only gets one
      // message at a time, preventing it from being overloaded.
      // It won't receive a new message until it acks the current one.
      this.consumeChannel.prefetch(1);

      // 3. Start consuming messages
      console.log(`[AMQP] Waiting for messages in queue: ${queue}`);

      this.consumeChannel.consume(queue, async (msg: ConsumeMessage | null) => {
        if (msg !== null) {
          try {
            // Process the message
            const content = JSON.parse(msg.content.toString());
            const success = await onMessage(content);

            if (success) {
              // Acknowledge the message (tells RabbitMQ we've processed it)
              this.consumeChannel?.ack(msg);
            } else {
              // Negative acknowledgement (tells RabbitMQ it failed)
              // 'false' at the end means don't requeue it,
              // which could prevent infinite loops.
              // You should have a Dead-Letter Exchange (DLX) setup
              // to handle these failed messages.
              this.consumeChannel?.nack(msg, false, false);
            }
          } catch (e) {
            console.error('[AMQP] Error processing message', e);
            // Nack the message on error
            this.consumeChannel?.nack(msg, false, false);
          }
        }
      });
    } catch (err) {
      console.error(
        `[AMQP] Failed to start consumer for queue '${queue}'`,
        err
      );
      // Retry
      setTimeout(() => this.startConsumer(queue, onMessage), 5000);
    }
  }

  /**
   * Comprehensive cleanup method for test environments.
   * Deletes specified queues and closes all channels and connections.
   */
  async cleanup(queues?: string[], closeConnection?: boolean): Promise<void> {
    try {
      // Delete test queues if specified
      if (queues && queues.length > 0) {
        for (const queue of queues) {
          await this.deleteQueue(queue);
        }
      }

      // Close channels
      await this.closeConsumeChannel();
      await this.closePublishChannel();

      // Close connection
      if (closeConnection && this.conn) {
        await this.conn.close();
        this.conn = null;
        console.log('[AMQP] Connection closed');
      }
    } catch (err) {
      console.error('[AMQP] Error during cleanup:', err);
    }
  }

  async closePublishChannel(): Promise<void> {
    if (this.publishChannel) {
      await this.publishChannel.close();
      this.publishChannel = null;
    }
  }

  async closeConsumeChannel(): Promise<void> {
    if (this.consumeChannel) {
      await this.consumeChannel.close();
      this.consumeChannel = null;
    }
  }

  /**
   * Deletes a queue and all its messages.
   * Useful for cleaning up test queues.
   */
  async deleteQueue(queue: string): Promise<boolean> {
    if (!this.publishChannel) {
      console.error('[AMQP] No publish channel found. Is service connected?');
      return false;
    }

    try {
      await this.publishChannel.deleteQueue(queue);
      console.log(`[AMQP] Queue '${queue}' deleted successfully`);
      return true;
    } catch (err) {
      console.error(`[AMQP] Failed to delete queue '${queue}'`, err);
      return false;
    }
  }
}

// Export the singleton instance
export const rabbitMQService = RabbitMQService.getInstance();
