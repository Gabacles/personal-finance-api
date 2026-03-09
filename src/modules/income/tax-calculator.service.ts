import { Injectable } from '@nestjs/common';
import { DeductionTableType } from '@prisma/client';
import { EntityNotFoundException } from '../../shared/exceptions/domain.exceptions';
import { PrismaService } from '../../shared/database/prisma.service';

// Shapes stored in DeductionTable.brackets JSON
interface InssBracket {
  upToCents: number | null;
  rateBps: number | null;
}

interface IrrfBracket {
  upToCents: number | null;
  rateBps: number;
  deductionCents: number;
}

/**
 * Optional metadata for the IRRF table.
 * Encodes the 2026 "monthly tax reduction" rule:
 *   - taxable ≤ reductionThreshold1Cents     → IR = 0
 *   - reductionThreshold1Cents < taxable ≤ reductionThreshold2Cents
 *       → IR = IR_base - (reductionFixedCents - reductionRatePer1M × taxable / 1_000_000)
 *   - taxable > reductionThreshold2Cents     → IR = IR_base (no reduction)
 */
interface IrrfMeta {
  reductionThreshold1Cents: number; // up to R$5.000,00 → IR zero (500_000)
  reductionThreshold2Cents: number; // up to R$7.350,00 → partial reduction (735_000)
  reductionFixedCents: number;      // R$978,62 → 97_862 cents
  reductionRatePer1M: number;       // 0,133145 × 1_000_000 → 133_145
}

export interface InssSlice {
  rateBps: number;
  appliedToCents: bigint;
  contributionCents: bigint;
}

export interface IrrfDetail {
  taxableBasisCents: bigint;
  rateBps: number;
  deductionAppliedCents: bigint;
  monthlyReductionCents: bigint;
  totalCents: bigint;
}

export interface TaxBreakdown {
  grossCents: bigint;
  inssCents: bigint;
  irrfCents: bigint;
  dependentAllowanceTotalCents: bigint;
  netCents: bigint;
  inssSlices: InssSlice[];
  irrfDetail: IrrfDetail;
}

// 2026 per-dependent monthly allowance: R$242,74 (Lei 14.663/2023 atualizada)
const DEPENDENT_ALLOWANCE_CENTS = 24_274n;

@Injectable()
export class TaxCalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async computeCLT(
    grossCents: bigint,
    year: number,
    dependents = 0,
  ): Promise<TaxBreakdown> {
    const [inssRow, irrfRow] = await Promise.all([
      this.prisma.deductionTable.findUnique({
        where: { type_validForYear: { type: DeductionTableType.INSS, validForYear: year } },
      }),
      this.prisma.deductionTable.findUnique({
        where: { type_validForYear: { type: DeductionTableType.IRRF, validForYear: year } },
      }),
    ]);

    if (!inssRow) throw new EntityNotFoundException('DeductionTable', `INSS/${year}`);
    if (!irrfRow) throw new EntityNotFoundException('DeductionTable', `IRRF/${year}`);

    const inssBrackets = inssRow.brackets as unknown as InssBracket[];
    const irrfBrackets = irrfRow.brackets as unknown as IrrfBracket[];
    const irrfMeta = irrfRow.meta as IrrfMeta | null;

    const { inssCents, inssSlices } = calcInss(grossCents, inssBrackets);
    const dependentAllowanceTotalCents = BigInt(dependents) * DEPENDENT_ALLOWANCE_CENTS;
    const { irrfCents, irrfDetail } = calcIrrf(
      grossCents,
      inssCents,
      dependentAllowanceTotalCents,
      irrfBrackets,
      irrfMeta ?? undefined,
    );
    const netCents = grossCents - inssCents - irrfCents;

    return {
      grossCents,
      inssCents,
      irrfCents,
      dependentAllowanceTotalCents,
      netCents,
      inssSlices,
      irrfDetail,
    };
  }
}

// ---------------------------------------------------------------------------
// Pure computation helpers (exported for unit testing without DI)
// ---------------------------------------------------------------------------

export function calcInss(
  grossCents: bigint,
  brackets: InssBracket[],
): { inssCents: bigint; inssSlices: InssSlice[] } {
  let prevCeiling = 0n;
  let inssCents = 0n;
  const inssSlices: InssSlice[] = [];

  for (const bracket of brackets) {
    if (bracket.rateBps === null) break; // contribution cap reached
    const ceiling =
      bracket.upToCents !== null ? BigInt(bracket.upToCents) : grossCents;
    const appliedToCents = sliceInRange(grossCents, prevCeiling, ceiling);
    if (appliedToCents <= 0n) break;
    const rateBps = BigInt(bracket.rateBps);
    const contributionCents = (appliedToCents * rateBps) / 10_000n;
    inssCents += contributionCents;
    inssSlices.push({ rateBps: bracket.rateBps, appliedToCents, contributionCents });
    prevCeiling = ceiling;
    if (grossCents <= ceiling) break;
  }

  return { inssCents, inssSlices };
}

export function calcIrrf(
  grossCents: bigint,
  inssCents: bigint,
  dependentAllowanceTotalCents: bigint,
  brackets: IrrfBracket[],
  meta?: IrrfMeta,
): { irrfCents: bigint; irrfDetail: IrrfDetail } {
  const taxableBasisCents = grossCents - inssCents - dependentAllowanceTotalCents;

  if (taxableBasisCents <= 0n) {
    return {
      irrfCents: 0n,
      irrfDetail: {
        taxableBasisCents: 0n,
        rateBps: 0,
        deductionAppliedCents: 0n,
        monthlyReductionCents: 0n,
        totalCents: 0n,
      },
    };
  }

  // Find first bracket where taxable fits (last bracket has upToCents: null = unlimited)
  const bracket =
    brackets.find(
      (b) => b.upToCents === null || taxableBasisCents <= BigInt(b.upToCents),
    ) ?? brackets[brackets.length - 1];

  if (bracket.rateBps === 0) {
    return {
      irrfCents: 0n,
      irrfDetail: {
        taxableBasisCents,
        rateBps: 0,
        deductionAppliedCents: 0n,
        monthlyReductionCents: 0n,
        totalCents: 0n,
      },
    };
  }

  const rateBps = BigInt(bracket.rateBps);
  const deductionApplied = BigInt(bracket.deductionCents);
  const grossIrrf = (taxableBasisCents * rateBps) / 10_000n;
  let irrfBase = grossIrrf > deductionApplied ? grossIrrf - deductionApplied : 0n;

  // Apply 2026 monthly reduction rule when meta is present
  let monthlyReductionCents = 0n;
  if (meta && irrfBase > 0n) {
    const t1 = BigInt(meta.reductionThreshold1Cents);
    const t2 = BigInt(meta.reductionThreshold2Cents);

    if (taxableBasisCents <= t1) {
      // Full reduction → IR = 0
      monthlyReductionCents = irrfBase;
      irrfBase = 0n;
    } else if (taxableBasisCents <= t2) {
      // Partial reduction: R$978,62 - (0,133145 × base)
      const fixedCents = BigInt(meta.reductionFixedCents);
      const ratePer1M = BigInt(meta.reductionRatePer1M);
      // reductionAmount = fixedCents - (ratePer1M * taxableBasisCents / 1_000_000)
      const variablePart = (ratePer1M * taxableBasisCents) / 1_000_000n;
      const reductionAmount = fixedCents > variablePart ? fixedCents - variablePart : 0n;
      monthlyReductionCents = reductionAmount < irrfBase ? reductionAmount : irrfBase;
      irrfBase = irrfBase - monthlyReductionCents;
    }
    // taxableBasisCents > t2 → no reduction
  }

  return {
    irrfCents: irrfBase,
    irrfDetail: {
      taxableBasisCents,
      rateBps: bracket.rateBps,
      deductionAppliedCents: deductionApplied,
      monthlyReductionCents,
      totalCents: irrfBase,
    },
  };
}

function sliceInRange(value: bigint, from: bigint, to: bigint): bigint {
  if (value <= from) return 0n;
  const effective = value < to ? value : to;
  return effective - from;
}
