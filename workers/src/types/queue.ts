import { Channel } from "amqplib";

export interface SendMessageOptions {
    durable?: boolean;
    persistent?: boolean;
}

export interface MessageData {
    topic: string;
    data: any;
    taskId: string;
}

export interface FibonacciMessageData extends MessageData {
    data: {
        n: number;
    };
}

export interface FibonacciResultMessageData extends MessageData {
    data: {
        n: number;
        result: number;
    };
}

export interface QueueMessage {
    topic: string;
    data: any;
    taskId: string;
}

export interface MessageBrokerService {
    connect(): Promise<void>;
    cleanup(queues: string[], closeConnection?: boolean): Promise<void>;
    sendMessage(queue: string, message: QueueMessage, options?: SendMessageOptions): Promise<void>;
    startConsumer(queue: string, onMessage: (msg: any) => Promise<boolean>): Promise<void>;
    createChannel(): Promise<Channel>;
    getConsumerChannel(): any;
    getPublishChannel(): any;
    startConsumer(queue: string, onMessage: (msg: any) => Promise<boolean>): Promise<void>;
    closeConsumeChannel(): Promise<void>;
    closePublishChannel(): Promise<void>;
    deleteQueue(queue: string): Promise<boolean>;
}