import { Injectable } from '@nestjs/common';
import { Prisma, RecurringTransaction } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

export interface RecurringFilters {
  type?: string;
  isActive?: boolean;
}

@Injectable()
export class RecurringRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.RecurringTransactionUncheckedCreateInput,
  ): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.create({ data });
  }

  async findAllByUser(
    userId: string,
    filters: RecurringFilters = {},
  ): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
        ...(filters.type ? { type: filters.type as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<RecurringTransaction | null> {
    return this.prisma.recurringTransaction.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  /**
   * Returns all active templates that apply to the given month:
   *   start_month <= month  AND  (end_month IS NULL OR end_month >= month)
   */
  async findActiveForMonth(
    userId: string,
    month: string,
  ): Promise<RecurringTransaction[]> {
    return this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
        startMonth: { lte: month },
        OR: [{ endMonth: null }, { endMonth: { gte: month } }],
      },
    });
  }

  async update(
    id: string,
    data: Prisma.RecurringTransactionUncheckedUpdateInput,
  ): Promise<RecurringTransaction> {
    return this.prisma.recurringTransaction.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.recurringTransaction.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
