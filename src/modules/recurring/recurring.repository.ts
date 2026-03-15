import { Injectable } from '@nestjs/common';
import { Prisma, RecurringTransaction } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  PaginationDto,
} from '../../shared/pagination/pagination.dto';

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
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<RecurringTransaction>> {
    const where: Prisma.RecurringTransactionWhereInput = {
      userId,
      deletedAt: null,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.type ? { type: filters.type as any } : {}),
    };

    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurringTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recurringTransaction.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
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
