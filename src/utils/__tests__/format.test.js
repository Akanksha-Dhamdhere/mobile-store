import { safeNum, safeToFixed, safeStr } from '../format';

describe('format helpers', () => {
  test('safeNum returns number or 0', () => {
    expect(safeNum(12)).toBe(12);
    expect(safeNum('12')).toBe(12);
    expect(safeNum(null)).toBe(0);
    expect(safeNum(undefined)).toBe(0);
    expect(safeNum('abc')).toBe(0);
  });

  test('safeToFixed returns formatted string', () => {
    expect(safeToFixed(12)).toBe('12.00');
    expect(safeToFixed('12.345', 1)).toBe('12.3');
    expect(safeToFixed(null)).toBe('0.00');
  });

  test('safeStr coerces values to string safely', () => {
    expect(safeStr('hello')).toBe('hello');
    expect(safeStr(123)).toBe('123');
    expect(safeStr(null)).toBe('');
    expect(safeStr(undefined)).toBe('');
  });
});
