import { MonthlyBudget, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export type BudgetWithAllocations = Prisma.MonthlyBudgetGetPayload<{
    include: {
        allocations: true;
    };
}>;
export declare class BudgetRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAllByUser(userId: string): Promise<BudgetWithAllocations[]>;
    findByMonth(userId: string, month: string): Promise<BudgetWithAllocations | null>;
    findById(id: string, userId: string): Promise<BudgetWithAllocations | null>;
    create(data: Prisma.MonthlyBudgetUncheckedCreateInput, tx?: Prisma.TransactionClient): Promise<MonthlyBudget>;
    update(id: string, data: Prisma.MonthlyBudgetUncheckedUpdateInput, tx?: Prisma.TransactionClient): Promise<MonthlyBudget>;
    deleteAllocations(monthlyBudgetId: string, tx?: Prisma.TransactionClient): Promise<void>;
    createAllocations(data: Prisma.BudgetAllocationUncheckedCreateInput[], tx?: Prisma.TransactionClient): Promise<void>;
    delete(id: string): Promise<void>;
}
