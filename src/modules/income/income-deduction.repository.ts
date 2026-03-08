import { Injectable } from '@nestjs/common';
import { IncomeDeduction, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class IncomeDeductionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    deductions: Prisma.IncomeDeductionUncheckedCreateInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<IncomeDeduction[]> {
    const client = tx ?? this.prisma;
    return Promise.all(
      deductions.map((d) => client.incomeDeduction.create({ data: d })),
    );
  }

  async deleteByEntry(
    incomeEntryId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.incomeDeduction.deleteMany({ where: { incomeEntryId } });
  }

  async deleteAutoByEntry(
    incomeEntryId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.incomeDeduction.deleteMany({
      where: { incomeEntryId, isAutomatic: true },
    });
  }

  async findByEntry(incomeEntryId: string): Promise<IncomeDeduction[]> {
    return this.prisma.incomeDeduction.findMany({
      where: { incomeEntryId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
