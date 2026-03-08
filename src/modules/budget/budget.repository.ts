import { Injectable } from '@nestjs/common';
import { MonthlyBudget, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

export type BudgetWithAllocations = Prisma.MonthlyBudgetGetPayload<{
  include: { allocations: true };
}>;

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string): Promise<BudgetWithAllocations[]> {
    return this.prisma.monthlyBudget.findMany({
      where: { userId },
      include: { allocations: true },
      orderBy: { referenceMonth: 'desc' },
    });
  }

  async findByMonth(
    userId: string,
    month: string,
  ): Promise<BudgetWithAllocations | null> {
    return this.prisma.monthlyBudget.findFirst({
      where: { userId, referenceMonth: month },
      include: { allocations: true },
    });
  }

  async findById(id: string, userId: string): Promise<BudgetWithAllocations | null> {
    return this.prisma.monthlyBudget.findFirst({
      where: { id, userId },
      include: { allocations: true },
    });
  }

  async create(
    data: Prisma.MonthlyBudgetUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MonthlyBudget> {
    const client = tx ?? this.prisma;
    return client.monthlyBudget.create({ data });
  }

  async update(
    id: string,
    data: Prisma.MonthlyBudgetUncheckedUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<MonthlyBudget> {
    const client = tx ?? this.prisma;
    return client.monthlyBudget.update({ where: { id }, data });
  }

  async deleteAllocations(
    monthlyBudgetId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.budgetAllocation.deleteMany({ where: { monthlyBudgetId } });
  }

  async createAllocations(
    data: Prisma.BudgetAllocationUncheckedCreateInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (data.length === 0) return;
    const client = tx ?? this.prisma;
    await client.budgetAllocation.createMany({ data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.monthlyBudget.delete({ where: { id } });
  }
}
