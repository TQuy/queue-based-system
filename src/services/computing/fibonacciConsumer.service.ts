import { isDev, isTest } from '@/utils/environment';
import { spawn } from 'child_process';

class FibonacciConsumerService {
  async consume({ n }: { n: number }): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      // Determine script path and execution method based on environment
      const isDevelopment = isTest() || isDev();
      const scriptPath = isDevelopment
        ? './src/workers/computing/fibonacci.childProcess.ts'
        : './dist/workers/computing/fibonacci.childProcess.js';

      // Use tsx for development (handles TS + path aliases), node for production
      const command = isDevelopment ? 'tsx' : 'node';
      const args = [scriptPath, n.toString()];

      const childProcess = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let result = '';
      let errorOutput = '';

      // Collect stdout data
      childProcess.stdout.on('data', (data: Buffer) => {
        result += data.toString();
      });

      // Collect stderr data
      childProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      // Handle process completion
      childProcess.on('close', code => {
        if (code === 0) {
          try {
            // Extract only digits from the result
            const digitsOnly = result.match(/\d+/);

            if (!digitsOnly || digitsOnly.length === 0) {
              reject(
                new Error(
                  `No valid number found in child process output: "${result}"`
                )
              );
              return;
            }

            const fibonacciResult = parseInt(digitsOnly[0], 10);
            resolve(fibonacciResult);
          } catch (error) {
            reject(new Error(`Failed to parse result: ${error}`));
          }
        } else {
          reject(
            new Error(`Child process exited with code ${code}: ${errorOutput}`)
          );
        }
      });

      // Handle process errors
      childProcess.on('error', error => {
        reject(new Error(`Failed to start child process: ${error.message}`));
      });

      // Set a timeout to prevent hanging processes
      const timeout = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new Error('Child process timed out'));
      }, 30000); // 30 second timeout

      childProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}

const fibonacciConsumerService = new FibonacciConsumerService();
export { fibonacciConsumerService };
export default FibonacciConsumerService;
