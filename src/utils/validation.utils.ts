import type { ZodError } from 'zod';

export function getZodErrorResponse(error: ZodError): {
  message: string;
  path: string;
}[] {
  const ret = [];
  for (const e of error.issues) {
    ret.push({
      message: e.message,
      path: e.path.join('.'),
    });
  }
  return ret;
}
