import { BinaryProcessor } from '@/lib/security/binary-units';

const STANDARD_CONFIG = {
  maxCycles: 1000,
  errorThreshold: 10,
  operationTimeout: 5000,
};

const VALID_BINARY = '10101010';
const INVALID_BINARY = '10203';

const assertSuccessfulResult = (result: any, expectedDataShape?: (data: any) => void) => {
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.duration).toBeGreaterThan(0);
  expect(result.errors).toEqual([]);
  
  if (expectedDataShape) {
      expectedDataShape(result.data);
  }
};

const assertFailureResult = (result: any) => {
  expect(result).toBeDefined();
  expect(result.success).toBe(false);
  expect(result.errors).toBeInstanceOf(Array);
  expect(result.errors.length).toBeGreaterThan(0);
};


describe('BinaryProcessor (PURITY PROTOCOL)', () => {

  describe('Core Execution (PROCESSOR UNIT)', () => {
    let processor: BinaryProcessor;

    beforeEach(() => {
      processor = new BinaryProcessor('PROCESSOR', STANDARD_CONFIG);
    });

    it('should process valid data successfully', async () => {
      const result = await processor.process(VALID_BINARY);
      assertSuccessfulResult(result);
    });

    it('should handle invalid data and report error state', async () => {
      const result = await processor.process(INVALID_BINARY);
      assertFailureResult(result);
    });
  });

  describe('Unit Specific Functionality', () => {
    
    it('ANALYZER should identify required patterns (ratio/ones)', async () => {
      const processor = new BinaryProcessor('ANALYZER', STANDARD_CONFIG);
      const binary = '101010111010';
      const result = await processor.process(binary);
      
      assertSuccessfulResult(result, (data) => {
        const parsedData = JSON.parse(data);
        expect(parsedData).toHaveProperty('ratio');
        expect(parsedData).toHaveProperty('ones');
        expect(typeof parsedData.ratio).toBe('number');
      });
    });

    it('VALIDATOR should assess structural integrity (valid/bytes)', async () => {
      const processor = new BinaryProcessor('VALIDATOR', STANDARD_CONFIG);
      const binary = '1001101011';
      const result = await processor.process(binary);

      assertSuccessfulResult(result, (data) => {
        const parsedData = JSON.parse(data);
        expect(parsedData).toHaveProperty('valid');
        expect(parsedData).toHaveProperty('bytes');
        expect(typeof parsedData.valid).toBe('boolean');
      });
    });

    it('OPTIMIZER should reduce data length (COMPRESSION SPEED TEST)', async () => {
      const processor = new BinaryProcessor('OPTIMIZER', STANDARD_CONFIG);
      const binary = '111111110000000011111111'; 
      const result = await processor.process(binary);

      assertSuccessfulResult(result);
      // Optimization mandate: data must be shorter.
      expect(result.data.length).toBeLessThan(binary.length); 
    });
  });

  describe('Metrics Tracking and Control', () => {
    let processor: BinaryProcessor;

    beforeEach(() => {
      processor = new BinaryProcessor('PROCESSOR', STANDARD_CONFIG);
    });

    it('should track cycles and errors across multiple operations', async () => {
      await processor.process(VALID_BINARY); // Cycle 1, Errors 0
      await processor.process(INVALID_BINARY); // Cycle 2, Errors 1
      
      const metrics = processor.getMetrics();

      expect(metrics.cycles).toBe(2);
      expect(metrics.errors).toBe(1); 
      expect(metrics.efficiency).toBeGreaterThan(0);
    });

    it('should reset metrics to zero state (PURITY MANDATE)', async () => {
      await processor.process(VALID_BINARY);
      processor.resetMetrics();

      const metrics = processor.getMetrics();

      expect(metrics.cycles).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.efficiency).toBe(0); 
    });
  });
});