import { hideSensitiveDataJSON } from '@/utils/sanitize.utils.js';

describe('sanitize.utils', () => {
  describe('hideSensitiveDataJSON', () => {
    it('should hide sensitive fields with ****', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        jwtToken: 'abc123def456',
      };

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed.username).toBe('john');
      expect(parsed.password).toBe('****');
      expect(parsed.jwtToken).toBe('****');
    });

    it('should handle nested objects with sensitive fields', () => {
      const data = {
        user: {
          id: 1,
          password: 'secret123',
          profile: {
            name: 'John',
            jwtToken: 'token123',
          },
        },
      };

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed.user.id).toBe(1);
      expect(parsed.user.password).toBe('****');
      expect(parsed.user.profile.name).toBe('John');
      expect(parsed.user.profile.jwtToken).toBe('****');
    });

    it('should handle arrays with sensitive fields', () => {
      const data = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', jwtToken: 'token2' },
      ];

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed[0].username).toBe('user1');
      expect(parsed[0].password).toBe('****');
      expect(parsed[1].username).toBe('user2');
      expect(parsed[1].jwtToken).toBe('****');
    });

    it('should handle empty objects', () => {
      const data = {};
      const result = hideSensitiveDataJSON(data);

      expect(result).toBe('{}');
    });

    it('should handle null and undefined values', () => {
      const data = {
        password: null,
        jwtToken: undefined,
        username: 'john',
      };

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed.password).toBe('****');
      expect(parsed.jwtToken).toBe('****');
      expect(parsed.username).toBe('john');
    });

    it('should handle primitive values', () => {
      const stringResult = hideSensitiveDataJSON('test');
      const numberResult = hideSensitiveDataJSON(123);
      const booleanResult = hideSensitiveDataJSON(true);

      expect(stringResult).toBe('"test"');
      expect(numberResult).toBe('123');
      expect(booleanResult).toBe('true');
    });

    it('should not modify fields that are not sensitive', () => {
      const data = {
        id: 1,
        username: 'john',
        email: 'john@example.com',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed).toEqual(data);
    });

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              password: 'deep-secret',
              normalField: 'normal-value',
            },
          },
        },
      };

      const result = hideSensitiveDataJSON(data);
      const parsed = JSON.parse(result);

      expect(parsed.level1.level2.level3.password).toBe('****');
      expect(parsed.level1.level2.level3.normalField).toBe('normal-value');
    });
  });
});
