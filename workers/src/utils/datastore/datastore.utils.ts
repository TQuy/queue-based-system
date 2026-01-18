import { TaskData } from "@/types/index.js";

export function isTaskCompleted(taskData: TaskData): boolean {
    return taskData.status === 'completed';
}

export function isTaskFailed(taskData: TaskData): boolean {
    return taskData.status === 'failed';
}