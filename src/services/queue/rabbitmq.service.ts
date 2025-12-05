import { SendMessageOptions } from '@/types/queue.js';
import type { Channel, ConsumeMessage, ChannelModel } from 'amqplib';
import { connect as amqpConnect } from 'amqplib';

/**
 * A production-ready RabbitMQ service that manages a single connection
 * but uses separate channels for publishing and consuming to improve
 * fault tolerance.
 */
class RabbitMQService {
  private conn: ChannelModel | null = null;
  private publishChannel: Channel | null = null;
  private consumeChannel: Channel | null = null;
  private closing: boolean = false;

  private static instance: RabbitMQService;

  // Private constructor for singleton
  private constructor() { }

  /**
   * Gets the singleton instance of the RabbitMQService.
   */
  public static getInstance(): RabbitMQService {
    if (!RabbitMQService.instance) {
      RabbitMQService.instance = new RabbitMQService();
    }
    return RabbitMQService.instance;
  }

  async createChannel() {
    try {
      const channel = await this.conn!.createChannel();
      return channel;
    } catch (err) {
      throw new Error('Failed to create channel', { cause: err });
    }
  }

  /**
   * Connects to the RabbitMQ server and creates separate channels
   * for publishing and consuming.
   */
  async connect(): Promise<void> {
    try {
      const amqpUrl = `${process.env['RABBITMQ_PROTOCOL'] || 'amqp'}://${process.env['RABBITMQ_USERNAME'] || 'myuser'}:${process.env['RABBITMQ_PASSWORD'] || 'mypassword'}@${process.env['RABBITMQ_HOST'] || 'localhost'}:${process.env['RABBITMQ_PORT'] || 5672}`;
      console.log(`[AMQP] Connecting to RabbitMQ at ${amqpUrl}`);
      this.conn = await amqpConnect(amqpUrl);
      console.log('[AMQP] RabbitMQ connection established');

      // Handle connection errors
      this.conn.on('error', err => {
        console.error('[AMQP] conn error', err.message);
        // Implement reconnection logic here
        this.conn = null;
      });
      this.conn.on('close', () => {
        if (!this.closing) {
          console.warn('[AMQP] RabbitMQ connection closed. Reconnecting...');
          this.conn = null;
          setTimeout(() => this.connect(), 5000); // Reconnect after 5s
        } else {
          console.log('[AMQP] RabbitMQ connection closed gracefully.');
          this.closing = false;
          this.conn = null;
        }
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

  getConsumerChannel(): Channel | null {
    return this.consumeChannel;
  }

  getPublishChannel(): Channel | null {
    return this.publishChannel;
  }

  /**
   * Sends a message to a specific queue using the dedicated publish channel.
   */
  async sendMessage(
    queue: string,
    message: any,
    options?: SendMessageOptions
  ): Promise<void> {
    if (!this.publishChannel) {
      throw new Error('[AMQP] No publish channel found. Is service connected?');
    }

    try {
      // Assert the queue
      await this.publishChannel.assertQueue(queue, {
        durable: options?.durable ?? true,
      });

      // Send the message
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.publishChannel.sendToQueue(queue, messageBuffer, {
        persistent: options?.persistent ?? true,
      });

      console.log(`[AMQP] Message sent to queue '${queue}'`);
    } catch (err) {
      // Handle error, maybe re-create channel
      throw new Error(`[AMQP] Failed to send message to queue '${queue}'`, {
        cause: err,
      });
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
        console.log(`[AMQP] Message received in queue: ${JSON.stringify(msg)}`);
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
   * If the connection is kept, also keep the publish channel.
   */
  async cleanup(queues?: string[], closeConnection?: boolean): Promise<void> {
    console.log('[AMQP] Starting cleanup process...');
    try {
      // Delete test queues if specified
      if (queues && queues.length > 0) {
        for (const queue of queues) {
          await this.deleteQueue(queue);
        }
      }

      // Close connection
      if (closeConnection && this.conn) {
        this.closing = true;
        await this.closePublishChannel();
        await this.closeConsumeChannel();
        await this.conn.close();
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
