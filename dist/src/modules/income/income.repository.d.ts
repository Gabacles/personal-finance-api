import { IncomeEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export type IncomeEntryWithDeductions = Prisma.IncomeEntryGetPayload<{
    include: {
        deductions: true;
    };
}>;
export declare class IncomeRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.IncomeEntryUncheckedCreateInput, tx?: Prisma.TransactionClient): Promise<IncomeEntry>;
    findAllByUser(userId: string): Promise<IncomeEntryWithDeductions[]>;
    findByMonth(userId: string, referenceMonth: string): Promise<IncomeEntryWithDeductions | null>;
    findById(id: string, userId: string): Promise<IncomeEntryWithDeductions | null>;
    update(id: string, data: Prisma.IncomeEntryUncheckedUpdateInput, tx?: Prisma.TransactionClient): Promise<IncomeEntry>;
    softDelete(id: string, tx?: Prisma.TransactionClient): Promise<void>;
}
