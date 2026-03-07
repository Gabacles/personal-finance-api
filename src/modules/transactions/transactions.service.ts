import { Injectable } from '@nestjs/common';
import { Prisma, TransactionOrigin, TransactionType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import {
  PaginatedResponse,
  PaginationDto,
} from '../../shared/pagination/pagination.dto';
import {
  TransactionFilters,
  TransactionWithRelations,
  TransactionsRepository,
} from './transactions.repository';

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

type PrismaTransactionClient = Omit<
  import('../../shared/database/prisma.service').PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async createExpense(
    input: CreateExpenseInput,
    tx?: PrismaTransactionClient,
  ): Promise<TransactionWithRelations> {
    return this.transactionsRepository.create(
      {
        userId: input.userId,
        categoryId: input.categoryId,
        paymentMethodId: input.paymentMethodId,
        description: input.description,
        amountCents: input.amountCents,
        type: TransactionType.EXPENSE,
        origin: TransactionOrigin.ONE_TIME,
        referenceMonth: input.referenceMonth,
        transactionDate: input.transactionDate,
        notes: input.notes,
      },
      tx,
    );
  }

  async createInstallmentBatch(
    inputs: CreateInstallmentTransactionInput[],
    tx: PrismaTransactionClient,
  ): Promise<void> {
    const data: Prisma.TransactionUncheckedCreateInput[] = inputs.map((i) => ({
      userId: i.userId,
      categoryId: i.categoryId,
      paymentMethodId: i.paymentMethodId,
      installmentPlanId: i.installmentPlanId,
      description: i.description,
      amountCents: i.amountCents,
      type: TransactionType.EXPENSE,
      origin: TransactionOrigin.INSTALLMENT,
      referenceMonth: i.referenceMonth,
      transactionDate: i.transactionDate,
      notes: i.notes,
    }));
    await this.transactionsRepository.createMany(data, tx);
  }

  async createFromRecurring(
    input: CreateRecurringTransactionInput,
  ): Promise<TransactionWithRelations | null> {
    try {
      return await this.transactionsRepository.create({
        userId: input.userId,
        categoryId: input.categoryId,
        paymentMethodId: input.paymentMethodId,
        recurringTransactionId: input.recurringTransactionId,
        description: input.description,
        amountCents: input.amountCents,
        type: input.type,
        origin: TransactionOrigin.RECURRING,
        referenceMonth: input.referenceMonth,
        transactionDate: input.transactionDate,
        notes: input.notes,
      });
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Already generated for this recurring + month — idempotent, skip
        return null;
      }
      throw err;
    }
  }

  async createIncomeTransaction(
    input: CreateIncomeTransactionInput,
    tx?: PrismaTransactionClient,
  ): Promise<TransactionWithRelations> {
    return this.transactionsRepository.create(
      {
        userId: input.userId,
        categoryId: input.categoryId,
        incomeEntryId: input.incomeEntryId,
        description: input.description,
        amountCents: input.amountCents,
        type: TransactionType.INCOME,
        origin: TransactionOrigin.INCOME,
        referenceMonth: input.referenceMonth,
        transactionDate: input.transactionDate,
        notes: input.notes,
      },
      tx,
    );
  }

  async findByFilters(
    userId: string,
    filters: TransactionFilters,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<TransactionWithRelations>> {
    return this.transactionsRepository.findByFilters(userId, filters, pagination);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<TransactionWithRelations> {
    const txn = await this.transactionsRepository.findById(id, userId);
    if (!txn) throw new EntityNotFoundException('Transaction', id);
    return txn;
  }
}
