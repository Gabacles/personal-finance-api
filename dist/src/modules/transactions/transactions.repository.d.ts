import { Prisma, Transaction, TransactionOrigin, TransactionType } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { PaginatedResponse, PaginationDto } from '../../shared/pagination/pagination.dto';
export type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: {
        category: true;
        paymentMethod: {
            include: {
                creditCard: true;
            };
        };
        installmentPlan: true;
    };
}>;
export interface TransactionFilters {
    type?: TransactionType;
    origin?: TransactionOrigin;
    referenceMonth?: string;
    paymentMethodId?: string;
    categoryId?: string;
}
type PrismaTransactionClient = Prisma.TransactionClient;
export declare class TransactionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.TransactionUncheckedCreateInput, tx?: PrismaTransactionClient): Promise<TransactionWithRelations>;
    createMany(data: Prisma.TransactionUncheckedCreateInput[], tx: PrismaTransactionClient): Promise<Transaction[]>;
    findByFilters(userId: string, filters: TransactionFilters, pagination: PaginationDto): Promise<PaginatedResponse<TransactionWithRelations>>;
    findById(id: string, userId: string): Promise<TransactionWithRelations | null>;
    update(id: string, data: Prisma.TransactionUncheckedUpdateInput): Promise<TransactionWithRelations>;
    softDelete(id: string): Promise<void>;
    findByRecurringAndMonth(recurringId: string, month: string): Promise<Transaction | null>;
    findFutureInstallments(planId: string, currentMonth: string): Promise<Transaction[]>;
}
export {};
