import { getIO } from "@/index.js";
import { TaskData } from "@/types/index.js";

/**Use websocket to return the result data */
export async function replyWithResult(
    data: TaskData,
    event: string,
) {
    const socketId = data.socketId;
    if (!socketId) {
        console.log(`No socketId found for task ${data.id}`);
        return;
    }
    const io = getIO();
    io.to(socketId).emit(event, {
        taskId: data.id,
        result: data.result
    });
    console.log(`Sent result for Task ID ${data.id} to client ${socketId}`);
}