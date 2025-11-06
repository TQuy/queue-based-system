import { z } from 'zod';
import { getZodErrorResponse } from '../validation.utils';

describe('validation.utils', () => {
  describe('getZodErrorResponse', () => {
    it('should return formatted error for single field validation failure', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      try {
        schema.parse({ email: 'invalid-email' });
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          message: 'Invalid email address',
          path: 'email',
        });
      }
    });

    it('should return formatted errors for multiple field validation failures', () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().min(0),
        email: z.string().email(),
      });

      try {
        schema.parse({ name: 'a', age: -1, email: 'invalid' });
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result).toHaveLength(3);
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              path: 'name',
            }),
            expect.objectContaining({
              message: expect.any(String),
              path: 'age',
            }),
            expect.objectContaining({
              message: expect.any(String),
              path: 'email',
            }),
          ])
        );
      }
    });

    it('should handle nested object validation errors with proper path', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            firstName: z.string().min(1),
            lastName: z.string().min(1),
          }),
        }),
      });

      try {
        schema.parse({
          user: {
            profile: {
              firstName: '',
              lastName: '',
            },
          },
        });
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result).toHaveLength(2);
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              path: 'user.profile.firstName',
            }),
            expect.objectContaining({
              message: expect.any(String),
              path: 'user.profile.lastName',
            }),
          ])
        );
      }
    });

    it('should handle array validation errors with proper indices', () => {
      const schema = z.object({
        items: z.array(
          z.object({
            name: z.string().min(1),
            price: z.number().positive(),
          })
        ),
      });

      try {
        schema.parse({
          items: [
            { name: '', price: -5 },
            { name: 'valid', price: 0 },
          ],
        });
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result.length).toBeGreaterThan(0);
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              path: 'items.0.name',
            }),
            expect.objectContaining({
              message: expect.any(String),
              path: 'items.0.price',
            }),
            expect.objectContaining({
              message: expect.any(String),
              path: 'items.1.price',
            }),
          ])
        );
      }
    });

    it('should handle root level validation errors', () => {
      const schema = z.email();

      try {
        schema.parse('invalid-email');
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          message: 'Invalid email address',
          path: '',
        });
      }
    });

    it('should preserve original error messages from Zod', () => {
      const schema = z.object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
      });

      try {
        schema.parse({ password: '123' });
      } catch (error) {
        const result = getZodErrorResponse(error as z.ZodError);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          message: 'Password must be at least 8 characters',
          path: 'password',
        });
      }
    });
  });
});
