import { Injectable } from '@nestjs/common';
import { IncomeEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

export type IncomeEntryWithDeductions = Prisma.IncomeEntryGetPayload<{
  include: { deductions: true };
}>;

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

  async findAllByUser(userId: string): Promise<IncomeEntryWithDeductions[]> {
    return this.prisma.incomeEntry.findMany({
      where: { userId, deletedAt: null },
      include: { deductions: true },
      orderBy: { referenceMonth: 'desc' },
    });
  }

  async findByMonth(
    userId: string,
    referenceMonth: string,
  ): Promise<IncomeEntryWithDeductions | null> {
    return this.prisma.incomeEntry.findFirst({
      where: { userId, referenceMonth, deletedAt: null },
      include: { deductions: true },
    });
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
