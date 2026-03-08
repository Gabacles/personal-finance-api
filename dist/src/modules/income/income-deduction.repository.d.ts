import { IncomeDeduction, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export declare class IncomeDeductionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createMany(deductions: Prisma.IncomeDeductionUncheckedCreateInput[], tx?: Prisma.TransactionClient): Promise<IncomeDeduction[]>;
    deleteByEntry(incomeEntryId: string, tx?: Prisma.TransactionClient): Promise<void>;
    deleteAutoByEntry(incomeEntryId: string, tx?: Prisma.TransactionClient): Promise<void>;
    findByEntry(incomeEntryId: string): Promise<IncomeDeduction[]>;
}
