import { calcInss, calcIrrf } from './tax-calculator.service';

// 2026 INSS brackets from the seed
const INSS_BRACKETS = [
  { upToCents: 182_074, rateBps: 750 },
  { upToCents: 303_456, rateBps: 900 },
  { upToCents: 455_184, rateBps: 1200 },
  { upToCents: 908_850, rateBps: 1400 },
  { upToCents: null, rateBps: null },
];

// 2026 IRRF brackets from the seed
const IRRF_BRACKETS = [
  { upToCents: 259_600, rateBps: 0, deductionCents: 0 },
  { upToCents: 386_800, rateBps: 750, deductionCents: 19_470 },
  { upToCents: 514_100, rateBps: 1500, deductionCents: 48_480 },
  { upToCents: 641_500, rateBps: 2250, deductionCents: 87_033 },
  { upToCents: null, rateBps: 2750, deductionCents: 119_138 },
];

const DEPENDENT_ALLOWANCE = 18_959n;

describe('TaxCalculatorService — pure computation', () => {
  // ---------------------------------------------------------------------------
  // INSS
  // ---------------------------------------------------------------------------

  describe('calcInss', () => {
    it('salary below all INSS thresholds (R$1,000 = 100_000 cents)', () => {
      const { inssCents, inssSlices } = calcInss(100_000n, INSS_BRACKETS);
      // Only first bracket applies: 100_000 * 750 / 10_000 = 7_500
      expect(inssCents).toBe(7_500n);
      expect(inssSlices).toHaveLength(1);
      expect(inssSlices[0].contributionCents).toBe(7_500n);
    });

    it('salary spanning multiple INSS brackets (R$5,000 = 500_000 cents)', () => {
      const { inssCents, inssSlices } = calcInss(500_000n, INSS_BRACKETS);
      // slice1: 182_074 * 750 / 10_000 = 13_655
      // slice2: 121_382 * 900 / 10_000 = 10_924
      // slice3: 151_728 * 1200 / 10_000 = 18_207
      // slice4: 44_816 * 1400 / 10_000 = 6_274
      expect(inssCents).toBe(49_060n);
      expect(inssSlices).toHaveLength(4);
    });

    it('salary above INSS cap (R$10,000 = 1_000_000 cents) — contribution capped', () => {
      const { inssCents, inssSlices } = calcInss(1_000_000n, INSS_BRACKETS);
      // Capped at 908_850:
      // slice1: 13_655  slice2: 10_924  slice3: 18_207  slice4: 63_513
      expect(inssCents).toBe(106_299n);
      expect(inssSlices).toHaveLength(4); // null bracket stops iteration
    });
  });

  // ---------------------------------------------------------------------------
  // IRRF
  // ---------------------------------------------------------------------------

  describe('calcIrrf', () => {
    it('taxable basis below exemption threshold → IRRF = 0', () => {
      // gross=100_000, inss=7_500, taxable=92_500 ≤ 259_600
      const { irrfCents } = calcIrrf(100_000n, 7_500n, 0n, IRRF_BRACKETS);
      expect(irrfCents).toBe(0n);
    });

    it('salary above IRRF exemption threshold (R$3,500 = 350_000 cents)', () => {
      // INSS = 13_655 + 10_924 + (46_544*1200/10_000=5_585) = 30_164
      // taxable = 350_000 - 30_164 = 319_836
      // bracket: 259_601–386_800 (7.5%, deduction 19_470)
      // irrf = 319_836 * 750 / 10_000 - 19_470 = 23_987 - 19_470 = 4_517
      const { inssCents } = calcInss(350_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(350_000n, inssCents, 0n, IRRF_BRACKETS);
      expect(inssCents).toBe(30_164n);
      expect(irrfCents).toBe(4_517n);
    });

    it('salary above all IRRF brackets (R$10,000 = 1_000_000 cents)', () => {
      // INSS capped at 106_299
      // taxable = 1_000_000 - 106_299 = 893_701
      // bracket: > 641_500 (27.5%, deduction 119_138)
      // irrf = 893_701 * 2750 / 10_000 - 119_138 = 245_767 - 119_138 = 126_629
      const { inssCents } = calcInss(1_000_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(1_000_000n, inssCents, 0n, IRRF_BRACKETS);
      expect(inssCents).toBe(106_299n);
      expect(irrfCents).toBe(126_629n);
    });

    it('with 2 dependents reduces IRRF (R$5,000 = 500_000 cents)', () => {
      // INSS = 49_060
      // dependentAllowance = 2 * 18_959 = 37_918
      // taxable = 500_000 - 49_060 - 37_918 = 413_022
      // bracket: 386_801–514_100 (15%, deduction 48_480)
      // irrf = 413_022 * 1500 / 10_000 - 48_480 = 61_953 - 48_480 = 13_473
      const { inssCents } = calcInss(500_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(
        500_000n,
        inssCents,
        2n * DEPENDENT_ALLOWANCE,
        IRRF_BRACKETS,
      );
      expect(irrfCents).toBe(13_473n);
    });

    it('net is less than gross after both deductions (R$5,000 no dependents)', () => {
      const { inssCents } = calcInss(500_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(500_000n, inssCents, 0n, IRRF_BRACKETS);
      // inss=49_060, irrf=19_161, net=431_779
      expect(inssCents).toBe(49_060n);
      expect(irrfCents).toBe(19_161n);
      expect(500_000n - inssCents - irrfCents).toBe(431_779n);
    });
  });
});
