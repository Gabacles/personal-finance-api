import { Injectable } from '@nestjs/common';
import {
  InstallmentPlan,
  InstallmentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';

export type InstallmentPlanWithTransactions = Prisma.InstallmentPlanGetPayload<{
  include: {
    transactions: {
      where: { deletedAt: null };
      include: { category: true; paymentMethod: true };
      orderBy: { referenceMonth: 'asc' };
    };
  };
}>;

const TRANSACTIONS_INCLUDE = {
  where: { deletedAt: null as null },
  include: { category: true, paymentMethod: true },
  orderBy: { referenceMonth: 'asc' as const },
} satisfies Prisma.InstallmentPlan$transactionsArgs;

@Injectable()
export class InstallmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.InstallmentPlanUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<InstallmentPlan> {
    return tx.installmentPlan.create({ data });
  }

  async findAllByUser(userId: string): Promise<InstallmentPlanWithTransactions[]> {
    return this.prisma.installmentPlan.findMany({
      where: { userId, deletedAt: null },
      include: { transactions: TRANSACTIONS_INCLUDE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(
    id: string,
    userId: string,
  ): Promise<InstallmentPlanWithTransactions | null> {
    return this.prisma.installmentPlan.findFirst({
      where: { id, userId, deletedAt: null },
      include: { transactions: TRANSACTIONS_INCLUDE },
    });
  }

  async cancel(
    planId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.installmentPlan.update({
      where: { id: planId },
      data: { status: InstallmentStatus.CANCELLED },
    });
  }
}
