export interface SendMessageOptions {
    durable?: boolean;
    persistent?: boolean;
}

export interface MessageData {
    topic: string;
    data: any;
    taskId: string;
}