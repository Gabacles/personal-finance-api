import { Injectable } from '@nestjs/common';
import { PaymentMethodType, Prisma, TransactionOrigin, TransactionType } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import {
  PaginatedResponse,
  PaginationDto,
} from '../../shared/pagination/pagination.dto';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  TransactionFilters,
  TransactionWithRelations,
  TransactionsRepository,
} from './transactions.repository';
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

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly prisma: PrismaService,
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
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
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

  async createDirectExpense(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionWithRelations> {
    if (dto.paymentMethodId) {
      const pm = await this.prisma.paymentMethod.findFirst({
        where: { id: dto.paymentMethodId, userId, deletedAt: null },
        select: { type: true },
      });
      if (!pm) throw new EntityNotFoundException('PaymentMethod', dto.paymentMethodId);
      if (pm.type === PaymentMethodType.CREDIT_CARD) {
        throw new BusinessRuleException(
          'USE_PURCHASES_FOR_CREDIT_CARD',
          'Use POST /api/v1/purchases for credit card expenses',
        );
      }
    }

    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: {
          id: dto.categoryId,
          deletedAt: null,
          OR: [{ userId }, { isSystem: true }],
        },
        select: { id: true },
      });
      if (!cat) throw new EntityNotFoundException('Category', dto.categoryId);
    }

    const transactionDate = new Date(dto.transactionDate);
    const referenceMonth = dto.transactionDate.slice(0, 7);

    return this.createExpense({
      userId,
      categoryId: dto.categoryId,
      paymentMethodId: dto.paymentMethodId,
      description: dto.description,
      amountCents: BigInt(dto.amountCents),
      referenceMonth,
      transactionDate,
      notes: dto.notes,
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionWithRelations> {
    const txn = await this.transactionsRepository.findById(id, userId);
    if (!txn) throw new EntityNotFoundException('Transaction', id);
    if (txn.origin !== TransactionOrigin.ONE_TIME) {
      throw new BusinessRuleException(
        'TRANSACTION_NOT_EDITABLE',
        'Only one-time transactions can be edited directly',
      );
    }

    return this.transactionsRepository.update(id, {
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.amountCents !== undefined && { amountCents: BigInt(dto.amountCents) }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const txn = await this.transactionsRepository.findById(id, userId);
    if (!txn) throw new EntityNotFoundException('Transaction', id);
    if (txn.origin !== TransactionOrigin.ONE_TIME) {
      throw new BusinessRuleException(
        'TRANSACTION_NOT_DELETABLE',
        'Only one-time transactions can be deleted directly',
      );
    }
    await this.transactionsRepository.softDelete(id);
  }

  async findByFilters(
    userId: string,
    filters: TransactionFilters,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<TransactionWithRelations>> {
    return this.transactionsRepository.findByFilters(userId, filters, pagination);
  }

  async findById(id: string, userId: string): Promise<TransactionWithRelations> {
    const txn = await this.transactionsRepository.findById(id, userId);
    if (!txn) throw new EntityNotFoundException('Transaction', id);
    return txn;
  }
}
