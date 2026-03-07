import { computeStatementMonth } from './credit-card-statement.service';

describe('computeStatementMonth', () => {
  describe('purchase day < closing day → same month', () => {
    it('returns purchase month when day is well before closing', () => {
      const result = computeStatementMonth(20, new Date('2026-03-10'));
      expect(result.referenceMonth).toBe('2026-03');
    });

    it('returns purchase month when day is one below closing', () => {
      const result = computeStatementMonth(15, new Date('2026-06-14'));
      expect(result.referenceMonth).toBe('2026-06');
    });
  });

  describe('purchase day = closing day → same month (boundary)', () => {
    it('closing day is inclusive — purchase on closing day stays in same month', () => {
      const result = computeStatementMonth(20, new Date('2026-03-20'));
      expect(result.referenceMonth).toBe('2026-03');
    });

    it('closing on day 1 — purchase on day 1 stays in same month', () => {
      const result = computeStatementMonth(1, new Date('2026-07-01'));
      expect(result.referenceMonth).toBe('2026-07');
    });
  });

  describe('purchase day > closing day → next month', () => {
    it('rolls into next month when purchase is after closing', () => {
      const result = computeStatementMonth(20, new Date('2026-03-21'));
      expect(result.referenceMonth).toBe('2026-04');
    });

    it('rolls into next month when purchase is well after closing', () => {
      const result = computeStatementMonth(5, new Date('2026-08-31'));
      expect(result.referenceMonth).toBe('2026-09');
    });
  });

  describe('December → January year overflow', () => {
    it('rolls December purchase (after closing) into January of next year', () => {
      const result = computeStatementMonth(10, new Date('2026-12-15'));
      expect(result.referenceMonth).toBe('2027-01');
    });

    it('December purchase on or before closing stays in December', () => {
      const result = computeStatementMonth(20, new Date('2026-12-20'));
      expect(result.referenceMonth).toBe('2026-12');
    });

    it('handles end-of-year boundary: Dec 31 with closing day 15', () => {
      const result = computeStatementMonth(15, new Date('2026-12-31'));
      expect(result.referenceMonth).toBe('2027-01');
    });
  });

  describe('YYYY-MM format correctness', () => {
    it('pads single-digit months with a leading zero', () => {
      const result = computeStatementMonth(20, new Date('2026-01-10'));
      expect(result.referenceMonth).toBe('2026-01');
    });

    it('handles February correctly', () => {
      const result = computeStatementMonth(28, new Date('2026-02-28'));
      expect(result.referenceMonth).toBe('2026-02');
    });
  });
});
