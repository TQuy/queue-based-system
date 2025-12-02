import { TaskData } from "@/services/datastore/types.js";

export function isTaskCompleted(taskData: TaskData): boolean {
    return taskData.status === 'completed';
}