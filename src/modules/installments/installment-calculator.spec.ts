import {
  calculateInstallmentAmounts,
  computeInstallmentReferenceMonths,
} from './installment-calculator';

describe('calculateInstallmentAmounts', () => {
  it('divides evenly when no remainder', () => {
    const amounts = calculateInstallmentAmounts(BigInt(30000), 3);
    expect(amounts).toEqual([BigInt(10000), BigInt(10000), BigInt(10000)]);
  });

  it('adds single-cent remainder to last installment', () => {
    // 100 / 3 = 33 with remainder 1
    const amounts = calculateInstallmentAmounts(BigInt(100), 3);
    expect(amounts).toEqual([BigInt(33), BigInt(33), BigInt(34)]);
  });

  it('adds multi-cent remainder to last installment', () => {
    // 1000 / 3 = 333 with remainder 1 ... wait: 333*3=999, rem=1
    // 1001 / 3 = 333 with remainder 2
    const amounts = calculateInstallmentAmounts(BigInt(1001), 3);
    expect(amounts).toEqual([BigInt(333), BigInt(333), BigInt(335)]);
  });

  it('handles 2-installment split', () => {
    const amounts = calculateInstallmentAmounts(BigInt(9999), 2);
    expect(amounts).toEqual([BigInt(4999), BigInt(5000)]);
  });

  it('returns array of correct length', () => {
    const amounts = calculateInstallmentAmounts(BigInt(50000), 6);
    expect(amounts).toHaveLength(6);
    const total = amounts.reduce((s, v) => s + v, BigInt(0));
    expect(total).toBe(BigInt(50000));
  });
});

describe('computeInstallmentReferenceMonths', () => {
  it('generates sequential months from a mid-year start', () => {
    const months = computeInstallmentReferenceMonths('2026-03', 3);
    expect(months).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('handles December → January of next year overflow', () => {
    const months = computeInstallmentReferenceMonths('2026-11', 4);
    expect(months).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
  });

  it('handles January as first month', () => {
    const months = computeInstallmentReferenceMonths('2026-01', 2);
    expect(months).toEqual(['2026-01', '2026-02']);
  });

  it('handles a 12-month span crossing year boundary', () => {
    const months = computeInstallmentReferenceMonths('2026-06', 12);
    expect(months[0]).toBe('2026-06');
    expect(months[6]).toBe('2026-12');
    expect(months[7]).toBe('2027-01');
    expect(months[11]).toBe('2027-05');
    expect(months).toHaveLength(12);
  });

  it('pads single-digit months with leading zero', () => {
    const months = computeInstallmentReferenceMonths('2026-09', 3);
    expect(months).toEqual(['2026-09', '2026-10', '2026-11']);
  });
});
