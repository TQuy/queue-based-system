import type { ZodError } from 'zod';

export function getZodErrorResponse(error: ZodError): {
  message: string;
  path: string;
} {
  return {
    message: error.issues[0]!.message,
    path: error.issues![0]!.path.join('.'),
  };
}
