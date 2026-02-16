import { describe, it, expect } from 'vitest';
import { calculateDeferredSharesBalance, calculateDeferredSharesBalanceSafe } from '@/utils/deferredSharesCalculator';

describe('Deferred Shares Calculator', () => {
  describe('calculateDeferredSharesBalance', () => {
    it('should calculate correct balance for basic case', () => {
      const result = calculateDeferredSharesBalance(1000, 5000, 4000);
      expect(result).toBe(48000);
    });

    it('should calculate balance when price equals purchase price', () => {
      const result = calculateDeferredSharesBalance(1000, 5000, 5000);
      expect(result).toBe(50000);
    });

    it('should calculate balance when current price is lower than purchase price', () => {
      const result = calculateDeferredSharesBalance(1000, 3000, 5000);
      expect(result).toBe(34000);
    });

    it('should handle zero shares', () => {
      const result = calculateDeferredSharesBalance(0, 5000, 4000);
      expect(result).toBe(0);
    });

    it('should return 0 for negative shares', () => {
      const result = calculateDeferredSharesBalance(-100, 5000, 4000);
      expect(result).toBe(0);
    });

    it('should return 0 for negative current price', () => {
      const result = calculateDeferredSharesBalance(1000, -5000, 4000);
      expect(result).toBe(0);
    });

    it('should return 0 for negative purchase price', () => {
      const result = calculateDeferredSharesBalance(1000, 5000, -4000);
      expect(result).toBe(0);
    });

    it('should handle large numbers correctly', () => {
      const result = calculateDeferredSharesBalance(1000000, 10000, 8000);
      expect(result).toBe(96000000);
    });
  });

  describe('calculateDeferredSharesBalanceSafe', () => {
    it('should calculate balance from string values', () => {
      const result = calculateDeferredSharesBalanceSafe('1000', '5000', '4000');
      expect(result).toBe(48000);
    });

    it('should parse decimal strings as integers (ignoring decimals)', () => {
      const result = calculateDeferredSharesBalanceSafe('1000.5', '5000', '4000');
      expect(result).toBe(48000);
    });

    it('should return null for missing values', () => {
      expect(calculateDeferredSharesBalanceSafe(null, '5000', '4000')).toBeNull();
      expect(calculateDeferredSharesBalanceSafe('1000', null, '4000')).toBeNull();
      expect(calculateDeferredSharesBalanceSafe('1000', '5000', null)).toBeNull();
    });

    it('should calculate correctly for valid inputs', () => {
      const result = calculateDeferredSharesBalanceSafe('2000', '8000', '4000');
      expect(result).toBe(144000);
    });
  });
});
