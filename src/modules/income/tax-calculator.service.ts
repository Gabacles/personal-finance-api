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

export interface InssSlice {
  rateBps: number;
  appliedToCents: bigint;
  contributionCents: bigint;
}

export interface IrrfDetail {
  taxableBasisCents: bigint;
  rateBps: number;
  deductionAppliedCents: bigint;
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

// 2026 IRRF per-dependent monthly allowance
const DEPENDENT_ALLOWANCE_CENTS = 18_959n;

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

    const { inssCents, inssSlices } = calcInss(grossCents, inssBrackets);
    const dependentAllowanceTotalCents = BigInt(dependents) * DEPENDENT_ALLOWANCE_CENTS;
    const { irrfCents, irrfDetail } = calcIrrf(
      grossCents,
      inssCents,
      dependentAllowanceTotalCents,
      irrfBrackets,
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
): { irrfCents: bigint; irrfDetail: IrrfDetail } {
  const taxableBasisCents = grossCents - inssCents - dependentAllowanceTotalCents;

  if (taxableBasisCents <= 0n) {
    return {
      irrfCents: 0n,
      irrfDetail: {
        taxableBasisCents: 0n,
        rateBps: 0,
        deductionAppliedCents: 0n,
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
        totalCents: 0n,
      },
    };
  }

  const rateBps = BigInt(bracket.rateBps);
  const deductionApplied = BigInt(bracket.deductionCents);
  const grossIrrf = (taxableBasisCents * rateBps) / 10_000n;
  const irrfCents = grossIrrf > deductionApplied ? grossIrrf - deductionApplied : 0n;

  return {
    irrfCents,
    irrfDetail: {
      taxableBasisCents,
      rateBps: bracket.rateBps,
      deductionAppliedCents: deductionApplied,
      totalCents: irrfCents,
    },
  };
}

function sliceInRange(value: bigint, from: bigint, to: bigint): bigint {
  if (value <= from) return 0n;
  const effective = value < to ? value : to;
  return effective - from;
}
