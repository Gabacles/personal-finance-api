import { InstallmentPlan, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
export type InstallmentPlanWithTransactions = Prisma.InstallmentPlanGetPayload<{
    include: {
        transactions: {
            where: {
                deletedAt: null;
            };
            include: {
                category: true;
                paymentMethod: true;
            };
            orderBy: {
                referenceMonth: 'asc';
            };
        };
    };
}>;
export declare class InstallmentsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.InstallmentPlanUncheckedCreateInput, tx: Prisma.TransactionClient): Promise<InstallmentPlan>;
    findAllByUser(userId: string): Promise<InstallmentPlanWithTransactions[]>;
    findById(id: string, userId: string): Promise<InstallmentPlanWithTransactions | null>;
    cancel(planId: string, tx: Prisma.TransactionClient): Promise<void>;
}
