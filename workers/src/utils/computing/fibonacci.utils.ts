/**
 * Pure utility to compute the n-th Fibonacci number iteratively.
 * F(0)=0, F(1)=1, F(n) = F(n-1) + F(n-2).
 * Throws for negative or non-integer input.
 *
 * Time complexity: O(n)
 * Space complexity: O(1)
 */
export function calculateFibonacciNumber(n: number): number {
  if (!Number.isInteger(n)) {
    throw new Error("n must be an integer");
  }
  if (n < 0) {
    throw new Error("n needs to be non-negative");
  }
  if (n <= 1) {
    return n;
  }

  let a = 1;
  let b = 1;
  for (let i = 0; i < n - 2; i++) {
    const temp = b;
    b = a + b;
    a = temp;
  }
  return b;
}
