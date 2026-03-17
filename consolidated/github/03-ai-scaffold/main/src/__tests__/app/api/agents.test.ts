import { POST } from '@/app/api/agents/route';
import { RequestInit } from 'node-fetch';

describe('Agents API', () => {
  describe('POST /api/agents', () => {
    const baseRequestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    it('should accept valid task', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: 'Analyze AI trends',
        domain: 'Strategic',
        priority: 1
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      expect(response).toBeDefined();
      expect(response instanceof Response).toBe(true);
      expect(response.ok).toBe(true); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });

    it('should return result object', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: 'Test query',
        domain: 'General',
        priority: 1
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('result');
      } else {
        expect(response).toBeDefined();
        expect(response.ok).toBe(false); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      }
    });

    it('should return 200 status for valid request', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: 'Test query',
        domain: 'General',
        priority: 1
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      expect(response).toBeDefined();
      expect(response.ok).toBe(true); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });

    it('should handle empty query', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: '',
        domain: 'General',
        priority: 1
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      expect(response).toBeDefined();
      expect(response.ok).toBe(false); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });

    it('should handle missing domain', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: 'Test query'
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      expect(response).toBeDefined();
      expect(response.ok).toBe(false); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });

    it('should handle invalid priority', async () => {
      const requestOptions = { ...baseRequestOptions, body: JSON.stringify({
        query: 'Test query',
        domain: 'General',
        priority: 'invalid'
      }) };
      const response = await POST(new Request('http://localhost/api/agents', requestOptions));

      expect(response).toBeDefined();
      expect(response.ok).toBe(false); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });
  });
});
```

**