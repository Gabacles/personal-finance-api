import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Transaction,
  TransactionOrigin,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  PaginationDto,
} from '../../shared/pagination/pagination.dto';

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: {
    category: true;
    paymentMethod: { include: { creditCard: true } };
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

type PrismaTransactionClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const RELATIONS = {
  category: true,
  paymentMethod: { include: { creditCard: true } },
  installmentPlan: true,
} as const;

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.TransactionUncheckedCreateInput,
    tx?: PrismaTransactionClient,
  ): Promise<TransactionWithRelations> {
    const client = tx ?? this.prisma;
    return client.transaction.create({ data, include: RELATIONS });
  }

  async createMany(
    data: Prisma.TransactionUncheckedCreateInput[],
    tx: PrismaTransactionClient,
  ): Promise<Transaction[]> {
    // createMany does not support returning records; create in loop within tx
    return Promise.all(data.map((d) => tx.transaction.create({ data: d, include: RELATIONS }))) as unknown as Transaction[];
  }

  async findByFilters(
    userId: string,
    filters: TransactionFilters,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<TransactionWithRelations>> {
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      ...(filters.type && { type: filters.type }),
      ...(filters.origin && { origin: filters.origin }),
      ...(filters.referenceMonth && { referenceMonth: filters.referenceMonth }),
      ...(filters.paymentMethodId && { paymentMethodId: filters.paymentMethodId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
    };

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: RELATIONS,
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<TransactionWithRelations | null> {
    return this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: RELATIONS,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByRecurringAndMonth(
    recurringId: string,
    month: string,
  ): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: {
        recurringTransactionId: recurringId,
        referenceMonth: month,
        deletedAt: null,
      },
    });
  }

  async findFutureInstallments(
    planId: string,
    currentMonth: string,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        installmentPlanId: planId,
        referenceMonth: { gte: currentMonth },
        deletedAt: null,
      },
      orderBy: { referenceMonth: 'asc' },
    });
  }
}
