import { calcInss, calcIrrf } from './tax-calculator.service';

// ---------------------------------------------------------------------------
// 2026 official tables (source: gov.br, Jan 2026)
// ---------------------------------------------------------------------------

const INSS_BRACKETS = [
  { upToCents: 162_100, rateBps: 750 },   // up to R$1.621,00 → 7,5%
  { upToCents: 290_284, rateBps: 900 },   // R$1.621,01 – R$2.902,84 → 9%
  { upToCents: 435_427, rateBps: 1200 },  // R$2.902,85 – R$4.354,27 → 12%
  { upToCents: 847_555, rateBps: 1400 },  // R$4.354,28 – R$8.475,55 → 14%
  { upToCents: null, rateBps: null },
];

const IRRF_BRACKETS = [
  { upToCents: 242_880, rateBps: 0,    deductionCents: 0      }, // isento  (até R$2.428,80)
  { upToCents: 282_665, rateBps: 750,  deductionCents: 18_216 }, // 7,5%  (parcela R$182,16)
  { upToCents: 375_105, rateBps: 1500, deductionCents: 39_416 }, // 15%   (parcela R$394,16)
  { upToCents: 466_468, rateBps: 2250, deductionCents: 67_549 }, // 22,5% (parcela R$675,49)
  { upToCents: null,    rateBps: 2750, deductionCents: 90_873 }, // 27,5% (parcela R$908,73)
];

// Redução mensal do imposto (2026)
const IRRF_META = {
  reductionThreshold1Cents: 500_000,  // até R$5.000,00 → IR = 0
  reductionThreshold2Cents: 735_000,  // até R$7.350,00 → redução parcial
  reductionFixedCents: 97_862,        // R$978,62
  reductionRatePer1M: 133_145,        // 0,133145 × 1_000_000
};

const DEPENDENT_ALLOWANCE = 24_274n; // R$242,74 por dependente (2026)

describe('TaxCalculatorService — pure computation (tabelas oficiais 2026)', () => {
  // ---------------------------------------------------------------------------
  // INSS
  // ---------------------------------------------------------------------------

  describe('calcInss', () => {
    it('salário abaixo da 1ª faixa (R$1.000 = 100_000 cents)', () => {
      const { inssCents, inssSlices } = calcInss(100_000n, INSS_BRACKETS);
      // Apenas 1ª faixa: 100_000 × 750 / 10_000 = 7_500
      expect(inssCents).toBe(7_500n);
      expect(inssSlices).toHaveLength(1);
      expect(inssSlices[0].contributionCents).toBe(7_500n);
    });

    it('salário atravessando múltiplas faixas INSS (R$5.000 = 500_000 cents)', () => {
      const { inssCents, inssSlices } = calcInss(500_000n, INSS_BRACKETS);
      // slice1: 162_100 × 750  / 10_000 = 12_157
      // slice2: 128_184 × 900  / 10_000 = 11_536
      // slice3: 145_143 × 1200 / 10_000 = 17_417
      // slice4:  64_573 × 1400 / 10_000 =  9_040
      // total = 50_150
      expect(inssCents).toBe(50_150n);
      expect(inssSlices).toHaveLength(4);
    });

    it('salário acima do teto INSS (R$10.000 = 1_000_000 cents) — contribuição limitada ao teto', () => {
      const { inssCents, inssSlices } = calcInss(1_000_000n, INSS_BRACKETS);
      // Capped em 847_555:
      // slice1: 12_157  slice2: 11_536  slice3: 17_417  slice4: 412_128×1400/10_000=57_697
      // total = 98_807
      expect(inssCents).toBe(98_807n);
      expect(inssSlices).toHaveLength(4);
    });

    it('salário exatamente no teto (R$8.475,55 = 847_555 cents)', () => {
      const { inssCents, inssSlices } = calcInss(847_555n, INSS_BRACKETS);
      // slice4 inteiro: (847_555 - 435_427) = 412_128 × 1400 / 10_000 = 57_697
      expect(inssSlices).toHaveLength(4);
      expect(inssCents).toBe(98_807n);
    });
  });

  // ---------------------------------------------------------------------------
  // IRRF (sem redução mensal)
  // ---------------------------------------------------------------------------

  describe('calcIrrf — sem redução mensal (sem meta)', () => {
    it('base tributável na faixa isenta → IRRF = 0', () => {
      // gross=100_000, inss=7_500, taxable=92_500 ≤ 242_880
      const { irrfCents } = calcIrrf(100_000n, 7_500n, 0n, IRRF_BRACKETS);
      expect(irrfCents).toBe(0n);
    });

    it('salário R$10.000 acima de todas as faixas IRRF (sem redução)', () => {
      // INSS = 98_807
      // taxable = 1_000_000 - 98_807 = 901_193
      // faixa 27,5% (> 466_468): 901_193 × 2750 / 10_000 - 90_873 = 247_828 - 90_873 = 156_955
      const { inssCents } = calcInss(1_000_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(1_000_000n, inssCents, 0n, IRRF_BRACKETS);
      expect(inssCents).toBe(98_807n);
      expect(irrfCents).toBe(156_955n);
    });
  });

  // ---------------------------------------------------------------------------
  // IRRF com redução mensal 2026
  // ---------------------------------------------------------------------------

  describe('calcIrrf — com redução mensal 2026 (meta presente)', () => {
    it('base tributável ≤ R$5.000 → IRRF = 0 (redução total)', () => {
      // R$5.000: INSS = 50_150, taxable = 449_850 ≤ 500_000 → IR = 0
      const { inssCents } = calcInss(500_000n, INSS_BRACKETS);
      const { irrfCents, irrfDetail } = calcIrrf(500_000n, inssCents, 0n, IRRF_BRACKETS, IRRF_META);
      expect(inssCents).toBe(50_150n);
      expect(irrfCents).toBe(0n);
      expect(irrfDetail.monthlyReductionCents).toBeGreaterThan(0n);
    });

    it('salário R$3.500 (base tributável ≤ R$5.000) → IRRF = 0', () => {
      // INSS: 162_100×750/10_000=12_157 + 128_184×900/10_000=11_536 + 59_716×1200/10_000=7_165 = 30_858
      // taxable = 350_000 - 30_858 = 319_142 ≤ 500_000 → IR = 0
      const { inssCents } = calcInss(350_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(350_000n, inssCents, 0n, IRRF_BRACKETS, IRRF_META);
      expect(inssCents).toBe(30_858n);
      expect(irrfCents).toBe(0n);
    });

    it('salário R$7.500 — redução parcial (base entre R$5.000 e R$7.350)', () => {
      // INSS = 85_150, taxable = 750_000 - 85_150 = 664_850
      // faixa 27,5%: 664_850 × 2750 / 10_000 - 90_873 = 182_833 - 90_873 = 91_960 (IR base)
      // 500_000 < 664_850 ≤ 735_000 → redução parcial:
      //   97_862 - (133_145 × 664_850 / 1_000_000) = 97_862 - 88_521 = 9_341
      // IRRF final: 91_960 - 9_341 = 82_619
      const { inssCents } = calcInss(750_000n, INSS_BRACKETS);
      const { irrfCents, irrfDetail } = calcIrrf(750_000n, inssCents, 0n, IRRF_BRACKETS, IRRF_META);
      expect(inssCents).toBe(85_150n);
      expect(irrfDetail.taxableBasisCents).toBe(664_850n);
      expect(irrfCents).toBe(82_619n);
      expect(irrfDetail.monthlyReductionCents).toBe(9_341n);
    });

    it('salário R$10.000 — sem redução (base > R$7.350)', () => {
      // taxable = 901_193 > 735_000 → sem redução mensal
      const { inssCents } = calcInss(1_000_000n, INSS_BRACKETS);
      const { irrfCents, irrfDetail } = calcIrrf(1_000_000n, inssCents, 0n, IRRF_BRACKETS, IRRF_META);
      expect(irrfCents).toBe(156_955n);
      expect(irrfDetail.monthlyReductionCents).toBe(0n);
    });

    it('2 dependentes reduzem a base do IRRF (R$5.000)', () => {
      // INSS = 50_150, dependents = 2 × 24_274 = 48_548
      // taxable = 500_000 - 50_150 - 48_548 = 401_302 ≤ 500_000 → IR = 0
      const { inssCents } = calcInss(500_000n, INSS_BRACKETS);
      const { irrfCents } = calcIrrf(
        500_000n,
        inssCents,
        2n * DEPENDENT_ALLOWANCE,
        IRRF_BRACKETS,
        IRRF_META,
      );
      expect(irrfCents).toBe(0n);
    });
  });
});
