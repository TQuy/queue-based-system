import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { FibonacciMessageData } from "@/types/queue.js";

export class FibonacciWorkerService {
    static async consume(data: FibonacciMessageData['data']): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            // In dev/test: use tsx to run TS files with path aliases
            // In prod: use compiled JS (no runtime TS/path-alias overhead)
            const rootDir = process.cwd();

            let workerPath = path.join(rootDir, 'dist', 'processes', 'computing', 'fibonacci.process.js');
            let execArgs: string[] = [];

            console.log('[Consumer] Initializing worker to execute data:', data);
            const worker = new Worker(workerPath, {
                execArgv: execArgs,
            });

            worker.postMessage(data);

            worker.on('message', (response: {
                success: boolean;
                result?: number;
                error?: string;
            }) => {
                if (response.success && response.result !== undefined) {
                    resolve(response.result);
                } else {
                    reject(new Error(response.error || 'Worker computation failed'));
                }
                void worker.terminate();
            });

            worker.on('error', (err) => {
                reject(err);
                void worker.terminate();
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }
}
