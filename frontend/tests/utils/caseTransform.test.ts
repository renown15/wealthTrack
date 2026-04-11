import { describe, it, expect } from 'vitest';
import { camelToSnake, toSnakeCase } from '@utils/caseTransform';

describe('camelToSnake', () => {
  it('converts camelCase to snake_case', () => {
    expect(camelToSnake('sharesAccountId')).toBe('shares_account_id');
  });

  it('leaves lowercase strings unchanged', () => {
    expect(camelToSnake('name')).toBe('name');
  });

  it('handles already snake_case strings', () => {
    expect(camelToSnake('my_value')).toBe('my_value');
  });

  it('handles single uppercase letter', () => {
    expect(camelToSnake('myA')).toBe('my_a');
  });

  it('handles consecutive uppercase letters', () => {
    expect(camelToSnake('myABC')).toBe('my_a_b_c');
  });
});

describe('toSnakeCase', () => {
  it('converts object keys from camelCase to snake_case', () => {
    const input = { sharesAccountId: 1, cashAccountId: 2 };
    expect(toSnakeCase(input)).toEqual({ shares_account_id: 1, cash_account_id: 2 });
  });

  it('recursively converts nested object keys', () => {
    const input = { outerKey: { innerValue: 'hello' } };
    expect(toSnakeCase(input)).toEqual({ outer_key: { inner_value: 'hello' } });
  });

  it('converts array of objects', () => {
    const input = [{ myKey: 1 }, { otherKey: 2 }];
    expect(toSnakeCase(input)).toEqual([{ my_key: 1 }, { other_key: 2 }]);
  });

  it('handles nested arrays', () => {
    const input = { items: [{ itemId: 1 }] };
    expect(toSnakeCase(input)).toEqual({ items: [{ item_id: 1 }] });
  });

  it('passes through primitive values unchanged', () => {
    expect(toSnakeCase('hello')).toBe('hello');
    expect(toSnakeCase(42)).toBe(42);
    expect(toSnakeCase(true)).toBe(true);
    expect(toSnakeCase(null)).toBeNull();
  });

  it('handles empty object', () => {
    expect(toSnakeCase({})).toEqual({});
  });

  it('handles empty array', () => {
    expect(toSnakeCase([])).toEqual([]);
  });
});
