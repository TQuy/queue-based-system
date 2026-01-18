export interface TaskData {
    id: string;
    type: string;
    input: any;
    status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    updatedAt: string;
    result?: any;
    completedAt?: string;
    failedAt?: string;
    socketId?: string;
}

export interface DatastoreService {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    setTask: (key: string, value: TaskData, ttl: number) => Promise<any>;
    getTask: (key: string) => Promise<TaskData | null>;
    updateTask: (key: string, updateData: Partial<TaskData>) => Promise<boolean>;
    updateTaskStatus: (key: string, status: TaskData['status']) => Promise<boolean>;
    deleteTask: (key: string) => Promise<boolean>;
    setTaskTTL(key: string, ttlSeconds: number): Promise<boolean>;
}