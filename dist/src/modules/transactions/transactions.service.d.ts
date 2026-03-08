import { Prisma, TransactionType } from '@prisma/client';
import { PaginatedResponse, PaginationDto } from '../../shared/pagination/pagination.dto';
import { PrismaService } from '../../shared/database/prisma.service';
import { TransactionFilters, TransactionWithRelations, TransactionsRepository } from './transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
type PrismaTransactionClient = Prisma.TransactionClient;
export interface CreateExpenseInput {
    userId: string;
    categoryId?: string;
    paymentMethodId?: string;
    description: string;
    amountCents: bigint;
    referenceMonth: string;
    transactionDate: Date;
    notes?: string;
}
export interface CreateInstallmentTransactionInput {
    userId: string;
    categoryId?: string;
    paymentMethodId: string;
    installmentPlanId: string;
    description: string;
    amountCents: bigint;
    referenceMonth: string;
    transactionDate: Date;
    notes?: string;
}
export interface CreateRecurringTransactionInput {
    userId: string;
    categoryId?: string;
    paymentMethodId?: string;
    recurringTransactionId: string;
    description: string;
    amountCents: bigint;
    type: TransactionType;
    referenceMonth: string;
    transactionDate: Date;
    notes?: string;
}
export interface CreateIncomeTransactionInput {
    userId: string;
    categoryId?: string;
    incomeEntryId: string;
    description: string;
    amountCents: bigint;
    referenceMonth: string;
    transactionDate: Date;
    notes?: string;
}
export declare class TransactionsService {
    private readonly transactionsRepository;
    private readonly prisma;
    constructor(transactionsRepository: TransactionsRepository, prisma: PrismaService);
    createExpense(input: CreateExpenseInput, tx?: PrismaTransactionClient): Promise<TransactionWithRelations>;
    createInstallmentBatch(inputs: CreateInstallmentTransactionInput[], tx: PrismaTransactionClient): Promise<void>;
    createFromRecurring(input: CreateRecurringTransactionInput): Promise<TransactionWithRelations | null>;
    createIncomeTransaction(input: CreateIncomeTransactionInput, tx?: PrismaTransactionClient): Promise<TransactionWithRelations>;
    createDirectExpense(userId: string, dto: CreateTransactionDto): Promise<TransactionWithRelations>;
    update(id: string, userId: string, dto: UpdateTransactionDto): Promise<TransactionWithRelations>;
    remove(id: string, userId: string): Promise<void>;
    findByFilters(userId: string, filters: TransactionFilters, pagination: PaginationDto): Promise<PaginatedResponse<TransactionWithRelations>>;
    findById(id: string, userId: string): Promise<TransactionWithRelations>;
}
export {};
