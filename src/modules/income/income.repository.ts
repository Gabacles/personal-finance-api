import { Injectable } from '@nestjs/common';
import { IncomeEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  buildPaginatedResponse,
  PaginatedResponse,
  PaginationDto,
} from '../../shared/pagination/pagination.dto';

export type IncomeEntryWithDeductions = Prisma.IncomeEntryGetPayload<{
  include: { deductions: true };
}>;

export interface IncomeFilters {
  referenceMonth?: string;
}

@Injectable()
export class IncomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.IncomeEntryUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<IncomeEntry> {
    const client = tx ?? this.prisma;
    return client.incomeEntry.create({ data });
  }

  async findAllByUser(
    userId: string,
    filters: IncomeFilters,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<IncomeEntryWithDeductions>> {
    const where: Prisma.IncomeEntryWhereInput = {
      userId,
      deletedAt: null,
      ...(filters.referenceMonth
        ? { referenceMonth: filters.referenceMonth }
        : {}),
    };
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.incomeEntry.findMany({
        where,
        include: { deductions: true },
        orderBy: [{ referenceMonth: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.incomeEntry.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<IncomeEntryWithDeductions | null> {
    return this.prisma.incomeEntry.findFirst({
      where: { id, userId, deletedAt: null },
      include: { deductions: true },
    });
  }

  async update(
    id: string,
    data: Prisma.IncomeEntryUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<IncomeEntry> {
    const client = tx ?? this.prisma;
    return client.incomeEntry.update({ where: { id }, data });
  }

  async softDelete(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.incomeEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
