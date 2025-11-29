import { parentPort } from 'worker_threads';
import { workerThreadResponse } from '@/types/index.js';
import { calculateFibonacciNumber } from '@/utils/computing/fibonacci.utils.js';

if (!parentPort) {
    throw new Error('This module must be run as a Worker thread');
}

// Listen for messages from the main thread
parentPort.on('message', ({ n }: { n: number }) => {
    try {
        const result = calculateFibonacciNumber(n);
        parentPort!.postMessage({ success: true, result } as workerThreadResponse);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        parentPort!.postMessage({
            success: false,
            error: errorMessage,
        } as workerThreadResponse);
    }
});
