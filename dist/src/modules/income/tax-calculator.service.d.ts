import { PrismaService } from '../../shared/database/prisma.service';
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
export declare class TaxCalculatorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    computeCLT(grossCents: bigint, year: number, dependents?: number): Promise<TaxBreakdown>;
}
export declare function calcInss(grossCents: bigint, brackets: InssBracket[]): {
    inssCents: bigint;
    inssSlices: InssSlice[];
};
export declare function calcIrrf(grossCents: bigint, inssCents: bigint, dependentAllowanceTotalCents: bigint, brackets: IrrfBracket[]): {
    irrfCents: bigint;
    irrfDetail: IrrfDetail;
};
export {};
