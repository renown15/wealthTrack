import { describe, it, expect } from 'vitest';
import { calculateDeferredSharesBalance, calculateDeferredSharesBalanceSafe } from '@/utils/deferredSharesCalculator';

describe('Deferred Shares Calculator', () => {
  describe('calculateDeferredSharesBalance', () => {
    it('should calculate correct balance for basic case', () => {
      // 1000 shares @ 5000p current, 4000p purchase
      // = 1000 × (0.8 × 5000 + 0.2 × 4000) / 100
      // = 1000 × (4000 + 800) / 100
      // = 1000 × 4800 / 100
      // = £48.00
      const result = calculateDeferredSharesBalance(1000, 5000, 4000);
      expect(result).toBe(48);
    });

    it('should calculate balance when price equals purchase price', () => {
      // 1000 shares @ 5000p current, 5000p purchase
      // = 1000 × (0.8 × 5000 + 0.2 × 5000) / 100
      // = 1000 × 5000 / 100
      // = £50.00
      const result = calculateDeferredSharesBalance(1000, 5000, 5000);
      expect(result).toBe(50);
    });

    it('should calculate balance when current price is lower than purchase price', () => {
      // 1000 shares @ 3000p current, 5000p purchase
      // = 1000 × (0.8 × 3000 + 0.2 × 5000) / 100
      // = 1000 × (2400 + 1000) / 100
      // = 1000 × 3400 / 100
      // = £34.00
      const result = calculateDeferredSharesBalance(1000, 3000, 5000);
      expect(result).toBe(34);
    });

    it('should handle zero shares', () => {
      const result = calculateDeferredSharesBalance(0, 5000, 4000);
      expect(result).toBe(0);
    });

    it('should handle zero prices', () => {
      const result = calculateDeferredSharesBalance(1000, 0, 0);
      expect(result).toBe(0);
    });

    it('should throw error for negative shares', () => {
      expect(() => calculateDeferredSharesBalance(-100, 5000, 4000)).toThrow();
    });

    it('should throw error for negative current price', () => {
      expect(() => calculateDeferredSharesBalance(1000, -5000, 4000)).toThrow();
    });

    it('should throw error for negative purchase price', () => {
      expect(() => calculateDeferredSharesBalance(1000, 5000, -4000)).toThrow();
    });

    it('should handle large numbers correctly', () => {
      // 1000000 shares @ 10000p current, 8000p purchase
      // = 1000000 × (0.8 × 10000 + 0.2 × 8000) / 100
      // = 1000000 × (8000 + 1600) / 100
      // = 1000000 × 9600 / 100
      // = £96000.00
      const result = calculateDeferredSharesBalance(1000000, 10000, 8000);
      expect(result).toBe(96000);
    });
  });

  describe('calculateDeferredSharesBalanceSafe', () => {
    it('should calculate balance from string values', () => {
      const result = calculateDeferredSharesBalanceSafe('1000', '5000', '4000');
      expect(result).toBe(48);
    });

    it('should return null for missing numberOfShares', () => {
      const result = calculateDeferredSharesBalanceSafe(null, '5000', '4000');
      expect(result).toBeNull();
    });

    it('should return null for missing currentPrice', () => {
      const result = calculateDeferredSharesBalanceSafe('1000', null, '4000');
      expect(result).toBeNull();
    });

    it('should return null for missing purchasePrice', () => {
      const result = calculateDeferredSharesBalanceSafe('1000', '5000', null);
      expect(result).toBeNull();
    });

    it('should return null for empty strings', () => {
      const result = calculateDeferredSharesBalanceSafe('', '5000', '4000');
      expect(result).toBeNull();
    });

    it('should return null for invalid number strings', () => {
      const result = calculateDeferredSharesBalanceSafe('abc', '5000', '4000');
      expect(result).toBeNull();
    });

    it('should return null for decimal strings', () => {
      const result = calculateDeferredSharesBalanceSafe('1000.5', '5000', '4000');
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = calculateDeferredSharesBalanceSafe(undefined, '5000', '4000');
      expect(result).toBeNull();
    });

    it('should calculate correctly for valid inputs', () => {
      const result = calculateDeferredSharesBalanceSafe('2000', '7000', '5000');
      // 2000 × (0.8 × 7000 + 0.2 × 5000) / 100
      // = 2000 × 6400 / 100
      // = £128.00
      expect(result).toBe(128);
    });
  });

  describe('Formula verification', () => {
    it('should verify the formula: balance = (shares × currentPrice) - (((shares × currentPrice) - (shares × purchasePrice)) × 0.2)', () => {
      const shares = 1000;
      const currentPrice = 5000;
      const purchasePrice = 4000;

      // Direct formula
      const directFormula = (shares * currentPrice) - (((shares * currentPrice) - (shares * purchasePrice)) * 0.2);
      const directResult = directFormula / 100; // Convert pence to pounds

      // Our simplified formula
      const simplifiedResult = calculateDeferredSharesBalance(shares, currentPrice, purchasePrice);

      expect(directResult).toBeCloseTo(simplifiedResult, 5);
    });

    it('should verify formula with different values', () => {
      const shares = 2500;
      const currentPrice = 8500;
      const purchasePrice = 6500;

      // Direct formula
      const directFormula = (shares * currentPrice) - (((shares * currentPrice) - (shares * purchasePrice)) * 0.2);
      const directResult = directFormula / 100;

      // Our simplified formula
      const simplifiedResult = calculateDeferredSharesBalance(shares, currentPrice, purchasePrice);

      expect(directResult).toBeCloseTo(simplifiedResult, 5);
    });
  });
});
