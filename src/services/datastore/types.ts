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
