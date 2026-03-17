import { calculateTotal, formatCurrency, delayOperation } from './Utility';

describe('Utility Functions', () => {

    // Test suite for synchronous calculation logic
    describe('calculateTotal', () => {
        const items = [
            { name: 'Product X', price: 10.50, quantity: 2 },
            { name: 'Product Y', price: 5.00, quantity: 3 }
        ];

        test('should calculate the correct total for multiple items', () => {
            // Expected: (10.50 * 2) + (5.00 * 3) = 21.00 + 15.00 = 36.00
            expect(calculateTotal(items)).toBeCloseTo(36.00);
        });

        test('should return 0 for an empty array of items', () => {
            expect(calculateTotal([])).toBe(0);
        });

        test('should handle items with quantity or price set to zero', () => {
            const zeroItems = [{ price: 100, quantity: 0 }, { price: 0, quantity: 5 }];
            expect(calculateTotal(zeroItems)).toBe(0);
        });

        // Functional purity check
        test('should not mutate the input array object reference', () => {
            const originalItems = JSON.parse(JSON.stringify(items));
            calculateTotal(items);
            expect(items).toEqual(originalItems);
        });

        // IMPROVEMENT: Test input validation and error handling
        test('should throw TypeError when input is null, undefined, or not an array', () => {
            expect(() => calculateTotal(null)).toThrow(TypeError);
            expect(() => calculateTotal(undefined)).toThrow(TypeError);
            expect(() => calculateTotal('not an array')).toThrow(TypeError);
        });

        // IMPROVEMENT: Test robustness against non-numeric item properties
        test('should calculate partial total when some item price/quantity values are non-numeric or missing', () => {
            const robustItems = [
                { price: 10, quantity: 2 },
                { price: 'invalid', quantity: 5 }, // Should effectively contribute 0
                { price: 5, quantity: 4 }
            ];
            // Expected total: (10 * 2) + (5 * 4) = 40.00
            expect(calculateTotal(robustItems)).toBeCloseTo(40.00);
        });
    });

    // Test suite for data transformation/formatting
    describe('formatCurrency', () => {
        test('should format positive numbers to standard US currency string', () => {
            expect(formatCurrency(1234.567)).toBe('$1,234.57'); // Rounds correctly
        });

        test('should format zero correctly', () => {
            expect(formatCurrency(0)).toBe('$0.00');
        });

        test('should handle negative numbers', () => {
            expect(formatCurrency(-99.99)).toBe('-$99.99');
        });

        // IMPROVEMENT: Edge case for very large numbers
        test('should correctly handle and format very large numbers with proper grouping', () => {
            expect(formatCurrency(123456789.9876)).toBe('$123,456,789.99');
        });

        // IMPROVEMENT: Handling numbers that require no rounding or specific trailing zeros
        test('should handle numbers with exactly two decimal places correctly', () => {
            expect(formatCurrency(42.00)).toBe('$42.00');
            expect(formatCurrency(42.50)).toBe('$42.50');
        });
    });

    // Test suite for asynchronous operations
    describe('delayOperation', () => {
        // Isolating time mocking to this describe block
        jest.useFakeTimers();

        test('should resolve after the specified delay time', async () => {
            const delayTime = 300;
            const delayPromise = delayOperation(delayTime);

            // Assert that the timer function was called correctly
            jest.advanceTimersByTime(delayTime);
            
            // The promise must now resolve after time advancement
            await expect(delayPromise).resolves.toBeUndefined();
            expect(setTimeout).toHaveBeenCalledTimes(1);
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delayTime);
        });
        
        // CLEANUP: Ensure real timers are restored after this describe block.
        afterAll(() => {
            jest.useRealTimers();
        });
    });
});