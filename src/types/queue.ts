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

export interface MessageBrokerService {
    connect(): Promise<void>;
    cleanup(queues: string[], closeConnection?: boolean): Promise<void>;
    sendMessage(queue: string, message: any, options?: SendMessageOptions): Promise<void>;
    startConsumer(queue: string, onMessage: (msg: any) => Promise<boolean>): Promise<void>;
    createChannel(): Promise<Channel>;
    getConsumerChannel(): any;
    getPublishChannel(): any;
    startConsumer(queue: string, onMessage: (msg: any) => Promise<boolean>): Promise<void>;
    closeConsumeChannel(): Promise<void>;
    closePublishChannel(): Promise<void>;
    deleteQueue(queue: string): Promise<boolean>;
}