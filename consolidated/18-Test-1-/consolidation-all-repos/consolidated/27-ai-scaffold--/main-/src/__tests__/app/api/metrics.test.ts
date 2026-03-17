import { GET } from '@/app/api/metrics/route';

describe('Metrics API', () => {
  const metricsResponse = await GET();

  describe('GET /api/metrics', () => {
    it('should return metrics successfully', async () => {
      expect(metricsResponse).toBeDefined();
      expect(metricsResponse instanceof Response).toBe(true);

      const { data, status } = await metricsResponse.json();
      expect(data).toBeDefined();
      expect(status).toBe(200);

      expect(data).toHaveProperty('totalConcepts');
      expect(data.totalConcepts).toEqual(expect.any(Number));

      expect(data).toHaveProperty('totalExperiences');
      expect(data.totalExperiences).toEqual(expect.any(Number));

      expect(data).toHaveProperty('activeAgents');
      expect(data.activeAgents).toEqual(expect.any(Number));

      expect(data).toHaveProperty('currentCycle');
      expect(data.currentCycle).toEqual(expect.any(Number));

      expect(data).toHaveProperty('encryptedPackets');
      expect(data.encryptedPackets).toEqual(expect.any(Number));

      expect(data).toHaveProperty('reasoningTraces');
      expect(data.reasoningTraces).toEqual(expect.any(Number));

      expect(data).toHaveProperty('status');
      expect(data.status).toEqual(expect.any(Object));
      expect(data.status).toHaveProperty('consciousness');
      expect(data.status).toHaveProperty('reasoning');
      expect(data.status).toHaveProperty('memory');
      expect(data.status).toHaveProperty('agents');
      expect(data.status).toHaveProperty('security');
      expect(data.status).toHaveProperty('learning');

      Object.values(data.status).forEach(status => {
        expect(['ACTIVE', 'IDLE', 'INACTIVE', 'ERROR']).toContain(status);
      });
    });

    it('should return correct structure', async () => {
      const { data } = await metricsResponse.json();

      expect(data).toBeDefined();
      expect(data).toHaveProperty('totalConcepts');
      expect(data.totalConcepts).toEqual(expect.any(Number));

      expect(data).toHaveProperty('totalExperiences');
      expect(data.totalExperiences).toEqual(expect.any(Number));

      expect(data).toHaveProperty('activeAgents');
      expect(data.activeAgents).toEqual(expect.any(Number));

      expect(data).toHaveProperty('currentCycle');
      expect(data.currentCycle).toEqual(expect.any(Number));

      expect(data).toHaveProperty('encryptedPackets');
      expect(data.encryptedPackets).toEqual(expect.any(Number));

      expect(data).toHaveProperty('reasoningTraces');
      expect(data.reasoningTraces).toEqual(expect.any(Number));
    });

    it('should return valid status object', async () => {
      const { data } = await metricsResponse.json();

      expect(data).toBeDefined();
      expect(data.status).toEqual(expect.any(Object));
      expect(data.status).toHaveProperty('consciousness');
      expect(data.status).toHaveProperty('reasoning');
      expect(data.status).toHaveProperty('memory');
      expect(data.status).toHaveProperty('agents');
      expect(data.status).toHaveProperty('security');
      expect(data.status).toHaveProperty('learning');

      Object.values(data.status).forEach(status => {
        expect(['ACTIVE', 'IDLE', 'INACTIVE', 'ERROR']).toContain(status);
      });
    });
  });
});
```

**