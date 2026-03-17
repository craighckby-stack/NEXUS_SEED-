// src/__tests__/app/api/security.test.ts
import { POST } from '@/app/api/security/route';
import { setupServer } from 'msw/node';

describe('Security API', () => {
  const server = setupServer();

  afterEach(() => {
    server.resetHandlers();
  });

  describe('POST /api/security', () => {
    const request = (action: string, data: any) => {
      return new Request('http://localhost/api/security', {
        method: 'POST',
        body: JSON.stringify({ action, data }),
      });
    };

    it('should handle encrypt action successfully', async () => {
      const response = await POST(request('encrypt', { text: 'test message' }));
      expect(response).toBeDefined();
      expect(response instanceof Response).toBe(true);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('encryptedPacket');
    });

    it('should handle decrypt action successfully', async () => {
      const response = await POST(request('decrypt', { encryptedPacket: {}, keyId: 'test-key' }));
      expect(response).toBeDefined();
      expect(response instanceof Response).toBe(true);
      expect(response.ok).toBe(true);
    });

    it('should handle process action successfully', async () => {
      const response = await POST(request('process', { binary: '101010', unitType: 'PROCESSOR' }));
      expect(response).toBeDefined();
      expect(response instanceof Response).toBe(true);
      expect(response.ok).toBe(true);
    });

    it('should handle generate-key action successfully', async () => {
      const response = await POST(request('generate-key', {}));
      expect(response).toBeDefined();
      expect(response instanceof Response).toBe(true);
      expect(response.ok).toBe(true);
    });

    it('should return error for invalid action', async () => {
      const response = await POST(request('invalid-action', {}));
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should return error for missing action', async () => {
      const response = await POST(request(''));
      expect(response).toBeDefined();
      expect(response.status).toBe(400);
    });
  });
});
```

**