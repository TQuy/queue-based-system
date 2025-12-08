import { createClient, RedisClientType } from 'redis';
import { isDev, isTest } from '@/utils/environment.utils.js';
import { DatastoreService, TaskData } from '@/types/index.js';

export class RedisService implements DatastoreService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  constructor() { }

  private setupEventListeners(): void {
    this.client!.on('connect', () => {
      console.log('[Redis] Connecting...');
    });

    this.client!.on('ready', () => {
      console.log('[Redis] Connected and ready');
      this.isConnected = true;
    });

    this.client!.on('error', err => {
      console.error('[Redis] Connection error:', err);
      this.isConnected = false;
    });

    this.client!.on('end', () => {
      console.log('[Redis] Connection ended');
      this.isConnected = false;
    });

    this.client!.on('reconnecting', () => {
      console.log('🔄 [Redis] Reconnecting...');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.client) {
      try {
        // Redis configuration
        const redisUrl =
          `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` ||
          'redis://localhost:6379';
        console.log(`[Redis] redisUrl: ${redisUrl}`);
        const redisConfig = {
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries: number) =>
              Math.min(retries * 50, 1000),
            maxReconnectAttempts: 0,
          },
        };

        this.client = createClient(redisConfig);

        // Set up event listeners
        this.setupEventListeners();
        await this.client.connect();
      } catch (error) {
        console.error('[Redis] Failed to connect to Redis:', error);
        throw error;
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client!.isReady;
  }

  /**
   * Ensure Redis connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isReady()) {
      await this.connect();
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected || this.client!.isReady) {
      try {
        this.client!.destroy();
        this.isConnected = false;
      } catch (error) {
        console.error('[Redis] Failed to disconnect from Redis:', error);
        // Still set to null and disconnected even on error
        this.client = null;
        this.isConnected = false;
        throw error;
      }
    }
  }

  /**
   * Set task data in Redis with optional TTL
   */
  async setTask(
    taskId: string,
    taskData: TaskData,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      await this.ensureConnection();

      const key = this.getTaskKey(taskId);
      const value = JSON.stringify(taskData);

      if (ttlSeconds) {
        await this.client!.setEx(key, ttlSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      if (isDev()) {
        console.log(
          `📝 [Redis] Task ${taskId} stored with status: ${taskData.status}`
        );
      }

      return true;
    } catch (error) {
      console.error('[Redis] Failed to set task in Redis:', error);
      return false;
    }
  }

  /**
   * Get task data from Redis
   */
  async getTask(taskId: string): Promise<TaskData | null> {
    console.log('[Redis] Getting task with ID:', taskId);
    try {
      await this.ensureConnection();

      const key = this.getTaskKey(taskId);
      const value = await this.client!.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as TaskData;
    } catch (error) {
      console.error('[Redis] Failed to get task from Redis:', error);
      return null;
    }
  }

  /**
   * Update task data in Redis
   */
  async updateTask(
    taskId: string,
    updateData: Partial<TaskData>
  ): Promise<boolean> {
    try {
      await this.ensureConnection();

      // Get existing task data
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        console.warn(`[Redis] Task ${taskId} not found for update`);
        return false;
      }

      // Merge with update data
      const updatedTask: TaskData = {
        ...existingTask,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      const key = this.getTaskKey(taskId);
      const value = JSON.stringify(updatedTask);

      await this.client!.set(key, value);

      if (isDev()) {
        console.log(
          `📝 [Redis] Task ${taskId} updated with data: ${JSON.stringify(updatedTask)}`
        );
      }

      return true;
    } catch (error) {
      console.error(new Error('[Redis] Failed to update task in Redis:', { cause: error }));
      return false;
    }
  }

  /**
   * Update only task status
   */
  async updateTaskStatus(
    taskId: string,
    status: TaskData['status']
  ): Promise<boolean> {
    const updateData: Partial<TaskData> = { status };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (status === 'failed') {
      updateData.failedAt = new Date().toISOString();
    }

    return this.updateTask(taskId, updateData);
  }

  /**
   * Delete task from Redis
   */
  async deleteTask(taskId: string): Promise<boolean> {
    try {
      await this.ensureConnection();

      const key = this.getTaskKey(taskId);
      const deleted = await this.client!.del(key);

      return deleted > 0;
    } catch (error) {
      console.error('[Redis] Failed to delete task from Redis:', error);
      return false;
    }
  }

  /**
   * Get all task IDs with optional status filter
   */
  async getTasksByStatus(status?: TaskData['status']): Promise<string[]> {
    try {
      await this.ensureConnection();

      const pattern = this.getTaskKey('*');
      const keys = await this.client!.keys(pattern);

      if (!status) {
        // Return all task IDs
        return keys.map(key => this.extractTaskIdFromKey(key));
      }

      // Filter by status
      const taskIds: string[] = [];
      for (const key of keys) {
        const value = await this.client!.get(key);
        if (value) {
          const task = JSON.parse(value) as TaskData;
          if (task.status === status) {
            taskIds.push(task.id);
          }
        }
      }

      return taskIds;
    } catch (error) {
      console.error('[Redis] Failed to get tasks by status from Redis:', error);
      return [];
    }
  }

  /**
   * Set TTL for existing task
   */
  async setTaskTTL(taskId: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.ensureConnection();

      const key = this.getTaskKey(taskId);
      const result = await this.client!.expire(key, ttlSeconds);

      return result === 1;
    } catch (error) {
      console.error('[Redis] Failed to set TTL for task in Redis:', error);
      return false;
    }
  }

  /**
   * Get TTL for task
   */
  async getTaskTTL(taskId: string): Promise<number> {
    try {
      await this.ensureConnection();

      const key = this.getTaskKey(taskId);
      return await this.client!.ttl(key);
    } catch (error) {
      console.error('[Redis] Failed to get TTL for task from Redis:', error);
      return -1;
    }
  }

  /**
   * Generate Redis key for task
   */
  private getTaskKey(taskId: string): string {
    const prefix = isTest() ? 'test:tasks' : 'tasks';
    return `${prefix}:${taskId}`;
  }

  /**
   * Extract task ID from Redis key
   */
  private extractTaskIdFromKey(key: string): string {
    const parts = key.split(':');
    return parts[parts.length - 1] || '';
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{
    status: string;
    connected: boolean;
    info?: any;
  }> {
    try {
      await this.ensureConnection();

      // Test with ping
      const pong = await this.client!.ping();

      return {
        status: 'healthy',
        connected: true,
        info: {
          ping: pong,
          ready: this.client!.isReady,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        info: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();
export default RedisService;
